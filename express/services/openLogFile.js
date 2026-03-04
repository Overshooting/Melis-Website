const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function parseEnUsDateFromServerFileName(fileName) {
    if (!fileName) {
        return null;
    }
	const fileNameWithoutExtension = fileName.replace(/\.js$/i, '').replace(/\.log$/i, '');
	const match = fileNameWithoutExtension.match(/^server-(\d{1,2})-(\d{1,2})-(\d{4})_(\d{2})-(\d{2})-(\d{2})$/i);

	if (!match) {
		return null;
	}

	const [, month, day, year, hour, minute, second] = match;
	const date = new Date(
		Number(year),
		Number(month) - 1,
		Number(day),
		Number(hour),
		Number(minute),
		Number(second)
	);

	return Number.isNaN(date.getTime()) ? null : date;
}

async function getMostRecentServerLogFileName() {
	const logDirectory = path.join(__dirname, '../../server_logs');
	const allFileNames = fs.readdirSync(logDirectory);
	const serverFileNames = allFileNames.filter((fileName) => fileName.toLowerCase().startsWith('server'));

	let mostRecentDate = null;
	let mostRecentFileName = null;

	for (const fileName of serverFileNames) {
		const fileDate = parseEnUsDateFromServerFileName(fileName);

		if (!fileDate) {
			continue;
		}

		if (!mostRecentDate || fileDate > mostRecentDate) {
			mostRecentDate = fileDate;
			mostRecentFileName = fileName;
		}
	}

	return new Promise((resolve, reject) => {
		if (mostRecentFileName) {
			resolve(mostRecentFileName);
		} else {
			reject(new Error('No server log files found.'));
		}
	});
}

async function openMostRecentLogFile() {
    console.log('Attempting to open the most recent server log file...');
    const mostRecentFileName = await getMostRecentServerLogFileName();
    if (!mostRecentFileName) {
        console.error('No server log files found.');
        return;
    } else {
        console.log(`Most recent log file found: ${mostRecentFileName}`);
    }

    const filePath = path.join(__dirname, '../../server_logs', mostRecentFileName);
    try {
        await fs.promises.access(filePath, fs.constants.R_OK);
        let command = 'tail -f ' + filePath;

        const childProcess = spawn(command, { shell: true });

        childProcess.stdout.on('data', (data) => {
            console.log(data.toString());
        });

        childProcess.stderr.on('data', (data) => {
            console.error(`Error output: ${data.toString()}`);
        });

        childProcess.on('error', (error) => {
            console.error(`Error executing command: ${error.message}`);
        });
    } catch (err) {
        console.error(`Cannot access file: ${err.message}`);
    }
}

openMostRecentLogFile();

        

