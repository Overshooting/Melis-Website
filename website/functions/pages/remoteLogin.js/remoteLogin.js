document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('remoteLoginForm');
		const status = document.getElementById('remoteLoginStatus');
		const sessionPanel = document.getElementById('remoteSession');
		const streamImage = document.getElementById('remoteStream');
		const disconnectButton = document.getElementById('remoteDisconnectButton');
		let socket = null;
		let sessionActive = false;
		let sessionKey = null;
		let frameTimeoutId = null;
		let firstFrameReceived = false;
		let frameMeta = { width: 0, height: 0 };
		let pendingFrame = null;
		let frameRenderScheduled = false;
		let disconnectInProgress = false;

        const csrfRes = await fetch('/api/csrf-token');
        const { csrfToken } = await csrfRes.json();

		function buildWebSocketUrl(path) {
			const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
			return `${protocol}://${window.location.host}${path}`;
		}

		function sendInput(payload) {
			if (!socket || socket.readyState !== WebSocket.OPEN) {
				return;
			}

			socket.send(JSON.stringify(payload));
		}

		function clearFrameTimeout() {
			if (frameTimeoutId) {
				clearTimeout(frameTimeoutId);
				frameTimeoutId = null;
			}
		}

		function startFrameTimeout() {
			clearFrameTimeout();
			firstFrameReceived = false;
			frameTimeoutId = setTimeout(() => {
				status.textContent = 'Remote session failed to start (no frames received).';
				requestDisconnect(false);
			}, 8000);
		}

		function sendDisconnectBeacon(currentSessionKey) {
			if (!currentSessionKey) {
				return;
			}

			const payload = JSON.stringify({ sessionKey: currentSessionKey });
			const blob = new Blob([payload], { type: 'application/json' });
			if (navigator.sendBeacon) {
				navigator.sendBeacon('/api/remote-login/disconnect', blob);
				return;
			}

			fetch('/api/remote-login/disconnect', {
				method: 'POST',
				credentials: 'include',
				headers: { 
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken
                 },
				body: JSON.stringify(payload),
				keepalive: true,
			}).catch(() => {});
		}

		async function requestDisconnect({ showStatus = true, useBeacon = false } = {}) {
			if (disconnectInProgress) {
				return;
			}

			disconnectInProgress = true;
			disconnectButton.disabled = true;
			clearFrameTimeout();

			const activeSessionKey = sessionKey;
			if (useBeacon) {
				sendDisconnectBeacon(activeSessionKey);
			} else if (activeSessionKey) {
				try {
					await fetch('/api/remote-login/disconnect', {
						method: 'POST',
                        credentials: 'include',
						headers: { 
							'Content-Type': 'application/json',
							'x-csrf-token': csrfToken
						 },
						body: JSON.stringify({ sessionKey: activeSessionKey }),
					});
				} catch (error) {
					// Ignore disconnect errors and continue cleanup.
				}
			}

			if (socket && socket.readyState === WebSocket.OPEN) {
				socket.close(1000, 'Client disconnect');
			}
			sessionActive = false;
			sessionKey = null;
			if (showStatus) {
				status.textContent = 'Remote session disconnected.';
			}
			form.hidden = false;
			sessionPanel.hidden = true;
			disconnectInProgress = false;
		}

		function clamp(value, min, max) {
			return Math.min(Math.max(value, min), max);
		}

		function getContentRect() {
			const rect = streamImage.getBoundingClientRect();
			if (rect.width === 0 || rect.height === 0) {
				return null;
			}

			const sourceWidth = frameMeta.width || streamImage.naturalWidth || rect.width;
			const sourceHeight = frameMeta.height || streamImage.naturalHeight || rect.height;
			const sourceRatio = sourceWidth / sourceHeight;
			const rectRatio = rect.width / rect.height;

			let contentWidth = rect.width;
			let contentHeight = rect.height;
			let offsetX = 0;
			let offsetY = 0;

			if (rectRatio > sourceRatio) {
				contentWidth = rect.height * sourceRatio;
				offsetX = (rect.width - contentWidth) / 2;
			} else {
				contentHeight = rect.width / sourceRatio;
				offsetY = (rect.height - contentHeight) / 2;
			}

			return {
				left: rect.left + offsetX,
				top: rect.top + offsetY,
				width: contentWidth,
				height: contentHeight,
			};
		}

		function handleMouseEvent(event, type) {
			const contentRect = getContentRect();
			if (!contentRect || contentRect.width === 0 || contentRect.height === 0) {
				return;
			}

			const rawX = (event.clientX - contentRect.left) / contentRect.width;
			const rawY = (event.clientY - contentRect.top) / contentRect.height;
			const x = clamp(rawX, 0, 1);
			const y = clamp(rawY, 0, 1);
			sendInput({ type, x, y, button: event.button === 2 ? 'right' : 'left' });
		}

		function attachInputHandlers() {
			streamImage.addEventListener('mousemove', (event) => {
				handleMouseEvent(event, 'mouseMove');
			});

			streamImage.addEventListener('mousedown', (event) => {
				streamImage.focus();
				handleMouseEvent(event, 'mouseDown');
			});

			streamImage.addEventListener('mouseup', (event) => {
				handleMouseEvent(event, 'mouseUp');
			});

			streamImage.addEventListener('contextmenu', (event) => {
				event.preventDefault();
			});

			streamImage.addEventListener('wheel', (event) => {
				sendInput({ type: 'wheel', deltaX: event.deltaX, deltaY: event.deltaY });
			});

			document.addEventListener('keydown', (event) => {
				if (!sessionActive) {
					return;
				}
				sendInput({ type: 'keyDown', key: event.key });
			});

			document.addEventListener('keyup', (event) => {
				if (!sessionActive) {
					return;
				}
				sendInput({ type: 'keyUp', key: event.key });
			});
		}

		function renderLatestFrame() {
			frameRenderScheduled = false;
			if (!pendingFrame) {
				return;
			}

			streamImage.src = `data:${pendingFrame.mime};base64,${pendingFrame.data}`;
			pendingFrame = null;
		}

		function connectStream(wsPath) {
			const wsUrl = buildWebSocketUrl(wsPath);
			socket = new WebSocket(wsUrl);

			socket.addEventListener('open', () => {
				sessionActive = true;
				status.textContent = 'Remote session started.';
				form.hidden = true;
				sessionPanel.hidden = false;
				disconnectButton.disabled = false;
				startFrameTimeout();
			});

			socket.addEventListener('message', (event) => {
				try {
					const payload = JSON.parse(event.data);
					if (payload.type === 'frame') {
						frameMeta = {
							width: Number(payload.width) || frameMeta.width,
							height: Number(payload.height) || frameMeta.height,
						};
						pendingFrame = payload;
						if (!frameRenderScheduled) {
							frameRenderScheduled = true;
							requestAnimationFrame(renderLatestFrame);
						}
						if (!firstFrameReceived) {
							firstFrameReceived = true;
							clearFrameTimeout();
						}
					} else if (payload.type === 'error') {
						status.textContent = payload.message;
					}
				} catch (error) {
					return;
				}
			});

			socket.addEventListener('close', () => {
				sessionActive = false;
				sessionKey = null;
				clearFrameTimeout();
				status.textContent = 'Remote session ended.';
				form.hidden = false;
				sessionPanel.hidden = true;
				disconnectButton.disabled = true;
			});

			socket.addEventListener('error', () => {
				sessionActive = false;
				sessionKey = null;
				clearFrameTimeout();
				status.textContent = 'Remote session error.';
				form.hidden = false;
				sessionPanel.hidden = true;
				disconnectButton.disabled = true;
			});
		}

		attachInputHandlers();
		disconnectButton.disabled = true;
		disconnectButton.addEventListener('click', () => requestDisconnect({ showStatus: true }));

		window.addEventListener('beforeunload', () => requestDisconnect({ showStatus: false, useBeacon: true }));
		window.addEventListener('pagehide', () => requestDisconnect({ showStatus: false, useBeacon: true }));
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'hidden') {
				requestDisconnect({ showStatus: false, useBeacon: true });
			}
		});

		form.addEventListener('submit', async (event) => {
			event.preventDefault();
			status.textContent = 'Submitting request...';

			const formData = new FormData(form);
			const payload = {
				adminPassword: formData.get('adminPassword'),
			};

			try {
				const response = await fetch('/api/remote-login', {
					method: 'POST',
                    credentials: 'include',
					headers: { 
                        'Content-Type': 'application/json', 
                        'x-csrf-token': csrfToken
                    },
					body: JSON.stringify(payload),
				});

				const result = await response.json().catch(() => null);
				if (!response.ok) {
					const fallbackMessage = result?.message
						|| (await response.text().catch(() => 'Request rejected.'))
						|| 'Request rejected.';
					status.textContent = fallbackMessage;
					return;
				}

				status.textContent = result?.message || 'Request completed.';
				if (result?.wsPath) {
					sessionKey = result?.sessionKey || null;
					connectStream(result.wsPath);
				}
			} catch (error) {
				status.textContent = 'Unable to submit request.';
			}
		});
    });