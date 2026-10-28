/* =====================================
   PERSONAL EXPENSE TRACKER
===================================== */

// Get HTML elements
const transactionForm = document.getElementById("transactionForm");
const typeInput = document.getElementById("type");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const filterInput = document.getElementById("filter");
const transactionTable = document.getElementById("transactionTable");
const emptyMessage = document.getElementById("emptyMessage");


// =====================================
// LOAD SAVED TRANSACTIONS
// =====================================

let transactions = [];

try {
    const savedTransactions = localStorage.getItem("transactions");

    if (savedTransactions) {
        const parsedTransactions = JSON.parse(savedTransactions);

        if (Array.isArray(parsedTransactions)) {
            transactions = parsedTransactions.filter(transaction =>
                transaction &&
                typeof transaction.id === "string" &&
                ["Income", "Expense"].includes(transaction.type) &&
                typeof transaction.description === "string" &&
                typeof transaction.category === "string" &&
                typeof transaction.date === "string" &&
                Number.isFinite(transaction.amount) &&
                transaction.amount > 0
            );
        }
    }
} catch (error) {
    console.error("Error loading transactions:", error);
}


// =====================================
// SET TODAY'S DATE
// =====================================

function setTodayDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    dateInput.value = `${year}-${month}-${day}`;
}


// =====================================
// FORMAT CURRENCY
// =====================================

function formatCurrency(amount) {
    return "LKR " + amount.toLocaleString("en-LK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


// =====================================
// SAVE TRANSACTIONS
// =====================================

function saveTransactions() {
    try {
        localStorage.setItem(
            "transactions",
            JSON.stringify(transactions)
        );

        return true;
    } catch (error) {
        console.error("Error saving transactions:", error);

        alert(
            "Unable to save the transaction. " +
            "Please check your browser storage."
        );

        return false;
    }
}


// =====================================
// GENERATE TRANSACTION ID
// =====================================

function createTransactionId() {
    let id;

    do {
        id = "";

        for (let i = 0; i < 16; i++) {
            id += Math.floor(Math.random() * 16).toString(16);
        }
    } while (
        transactions.some(transaction => transaction.id === id)
    );

    return id;
}


// =====================================
// ADD A TRANSACTION
// =====================================

transactionForm.addEventListener("submit", function(event) {
    event.preventDefault();

    // Get values from the form
    const type = typeInput.value;
    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);
    const category = categoryInput.value;
    const date = dateInput.value;

    // Validate the form
    if (
        !["Income", "Expense"].includes(type) ||
        description === "" ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        category === "" ||
        date === ""
    ) {
        alert(
            "Please complete all fields and enter an amount greater than zero."
        );

        return;
    }

    // Create transaction object
    const transaction = {
        id: createTransactionId(),
        type: type,
        description: description,
        amount: amount,
        category: category,
        date: date
    };

    // Add transaction to the array
    transactions.push(transaction);

    // Save transaction to localStorage
    if (!saveTransactions()) {
        transactions.pop();
        return;
    }

    // Update totals and table
    updateApplication();

    // Show success alert
    alert("Transaction added successfully,Hiruni!");

    // Clear the form
    transactionForm.reset();

    // Set today's date again
    setTodayDate();
});


// =====================================
// CALCULATE TOTALS
// =====================================

function calculateTotals() {
    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(function(transaction) {
        if (transaction.type === "Income") {
            totalIncome += transaction.amount;
        } else if (transaction.type === "Expense") {
            totalExpenses += transaction.amount;
        }
    });

    const balance = totalIncome - totalExpenses;

    // Display total income
    document.getElementById("totalIncome").textContent =
        formatCurrency(totalIncome);

    // Display total expenses
    document.getElementById("totalExpenses").textContent =
        formatCurrency(totalExpenses);

    // Display current balance
    document.getElementById("currentBalance").textContent =
        formatCurrency(balance);
}


// =====================================
// DISPLAY TRANSACTIONS
// =====================================

function displayTransactions() {
    // Clear the existing table rows
    transactionTable.replaceChildren();

    // Get selected filter
    const selectedFilter = filterInput.value;

    // Filter and sort transactions by date
    const filteredTransactions = transactions
        .filter(function(transaction) {
            return (
                selectedFilter === "All" ||
                transaction.type === selectedFilter
            );
        })
        .slice()
        .sort(function(a, b) {
            return b.date.localeCompare(a.date);
        });

    // Show or hide empty message
    emptyMessage.hidden = filteredTransactions.length > 0;

    // Display each transaction
    filteredTransactions.forEach(function(transaction) {
        const row = document.createElement("tr");

        // Date
        const dateCell = document.createElement("td");
        dateCell.textContent = transaction.date;
        row.appendChild(dateCell);

        // Description
        const descriptionCell = document.createElement("td");
        descriptionCell.textContent = transaction.description;
        row.appendChild(descriptionCell);

        // Type
        const typeCell = document.createElement("td");
        typeCell.textContent = transaction.type;

        if (transaction.type === "Income") {
            typeCell.className = "type-income";
        } else {
            typeCell.className = "type-expense";
        }

        row.appendChild(typeCell);

        // Category
        const categoryCell = document.createElement("td");
        categoryCell.textContent = transaction.category;
        row.appendChild(categoryCell);

        // Amount
        const amountCell = document.createElement("td");

        const sign =
            transaction.type === "Income" ? "+" : "-";

        amountCell.textContent =
            sign + " " + formatCurrency(transaction.amount);

        row.appendChild(amountCell);

        // Action button
        const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";

        deleteButton.setAttribute(
            "aria-label",
            "Delete transaction: " + transaction.description
        );

        // Delete button click event
        deleteButton.addEventListener("click", function() {
            deleteTransaction(transaction.id);
        });

        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);

        // Add row to table
        transactionTable.appendChild(row);
    });
}


// =====================================
// DELETE A TRANSACTION
// =====================================

function deleteTransaction(id) {
    const transactionIndex = transactions.findIndex(
        transaction => transaction.id === id
    );

    if (transactionIndex === -1) {
        return;
    }

    const deletedTransaction = transactions[transactionIndex];

    // Ask for confirmation
    const confirmed = confirm(
        "Are you sure you want to delete '" +
        deletedTransaction.description + "'?"
    );

    if (!confirmed) {
        return;
    }

    // Remove transaction
    transactions.splice(transactionIndex, 1);

    // Save the updated list
    if (!saveTransactions()) {
        transactions.splice(transactionIndex, 0, deletedTransaction);
        return;
    }

    // Update totals and table
    updateApplication();

    // Show success alert
    alert("Transaction deleted successfully!");
}


// =====================================
// FILTER TRANSACTIONS
// =====================================

filterInput.addEventListener("change", function() {
    displayTransactions();
});


// =====================================
// CLEAR FORM
// =====================================

transactionForm.addEventListener("reset", function() {
    setTimeout(function() {
        setTodayDate();
    }, 0);
});


// =====================================
// UPDATE THE APPLICATION
// =====================================

function updateApplication() {
    calculateTotals();
    displayTransactions();
}


// =====================================
// INITIALIZE APPLICATION
// =====================================

// Set today's date
setTodayDate();

// Display previously saved transactions
updateApplication();
