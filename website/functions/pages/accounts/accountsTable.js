document.addEventListener('DOMContentLoaded', function () {
  const container = document.getElementById('accountsTableContainer');
  if (!container) return;

  function renderTable(rows) {
    container.innerHTML = '';
    if (!rows || rows.length === 0) {
      container.textContent = 'No accounts found.';
      return;
    }

    const table = document.createElement('table');
    table.border = '1';
    table.cellPadding = '6';
    table.style.borderCollapse = 'collapse';

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const keys = Object.keys(rows[0]);
    keys.forEach((k) => {
      const th = document.createElement('th');
      if (k === 'userName') k = 'Account Name';
      th.textContent = k;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    rows.forEach((row) => {
      const tr = document.createElement('tr');
      keys.forEach((k) => {
        const td = document.createElement('td');
        td.textContent = row[k];
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    container.appendChild(table);
  }

  function fetchAccounts() {
    fetch('/api/accounts/data')
      .then((res) => {
        if (!res.ok) throw new Error('Error connecting to database server (is it on?)');
        return res.json();
      })
      .then((data) => renderTable(data))
      .catch((err) => {
        container.textContent = 'Error loading accounts: ' + err.message;
      });
  }

  fetchAccounts();
});
