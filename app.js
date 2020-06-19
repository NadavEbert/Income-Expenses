
//-----------------------------       BUDGET CONTROLLER             ---------------------------------


var budgetController = (function () {

    var data = {};



    class Income {
        constructor(id, description, value) {
            this.id = id;
            this.description = description;
            this.value = value;
        }
    }

    class Expense {
        constructor(id, description, value) {
            this.id = id;
            this.description = description;
            this.value = value;
            this.percentage = -1;
        }

        calculatePercentage(income) {
            if (income > 0)
                this.percentage = Math.round(this.value / income * 100);
            else
                this.percentage = -1;
        }
        static fromJSON(serializedJson) {
            return Object.assign(new Expense(), serializedJson)
        }
    }



    /*var Income = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    }

    var Expense = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    }

    Expense.prototype.calculatePercentage = function (income) {
        if (income > 0)
            this.percentage = Math.round(this.value / income * 100);
        else
            this.percentage = -1;
    }
    */

    var initData = function () {
        if (getDataFromLocalStorage()) {
            data = getDataFromLocalStorage();
            const expenseObjects = data.items.exp.map(exp => {
                console.log(exp)
                return Expense.fromJSON(exp);
            })
            data.items.exp = expenseObjects;
            console.log(data)
        }

        else
            resetData();

    }

    var getDataFromLocalStorage = function () {
        let pulledData = localStorage.getItem('data');
        if (pulledData)
            pulledData = JSON.parse(pulledData)
        return pulledData;

    }

    var resetData = function () {
        data = {
            items: {
                inc: [],
                exp: []
            },
            totals: {
                inc: 0,
                exp: 0
            },
            budget: 0,
            percentage: -1
        }
    }


    var generateId = function (typ) {
        var id;
        if (data.items[typ].length === 0)
            id = 0;
        else
            id = data.items[typ][data.items[typ].length - 1].id + 1;
        return id;
    }

    var generateItem = function (typ, id, des, val) {
        if (typ === 'inc') {
            newItem = new Income(id, des, val);
        }
        else if (typ === 'exp') {
            newItem = new Expense(id, des, val);
            newItem.calculatePercentage(data.totals.inc);
        }
        return newItem;
    }

    var calculateAndStoreTotals = function () {
        var incomeTotal = data.items.inc.reduce((total, currentValue) => total + currentValue);
        var expenseTotal = data.items.exp.reduce((total, currentValue) => total + currentValue);
        data.totals.inc = incomeTotal;
        data.totals.exp = expenseTotal;

    }

    var addLastToTotal = function (type) {
        data.totals[type] += data.items[type][data.items[type].length - 1].value;
    }

    var calculateAndStoreBudget = function () {
        data.budget = data.totals.inc - data.totals.exp;
    }
    var calculateAndStorePercentage = function () {
        if (data.totals.inc > 0)
            data.percentage = Math.round(data.totals.exp / data.totals.inc * 100);
        else
            data.percentage = 0;
    }
    // var dataObjtoString=function(){
    //      return stri
    //  }
    var updateListItemPercentages = function () {
        data.items.exp.forEach(exp => {
            exp.calculatePercentage(data.totals.inc);
        })
    }




    return {
        addNewItem: function (typ, des, val) {
            var newItem, id;
            id = generateId(typ);
            newItem = generateItem(typ, id, des, val)
            data.items[typ].push(newItem);
            addLastToTotal(typ);
            calculateAndStoreBudget();
            calculateAndStorePercentage();
            updateListItemPercentages();
            return newItem;

        },
        deleteItem: function (type, id) {
            var removedItemArray, idsArray, removedItemIndex;
            idsArray = data.items[type].map((current) => {
                //console.log(current.id);
                return current.id;
            })
            removedItemIndex = idsArray.indexOf(id);
            removedItemArray = data.items[type].splice(removedItemIndex, 1);
            //console.log(removedItemArray[0]);
            data.totals[type] -= removedItemArray[0].value;
            calculateAndStoreBudget();
            calculateAndStorePercentage();
            updateListItemPercentages();
            //console.log(data);
        },
        getItems: function () {
            return data.items;
        },
        getbudget: function () {
            return data.budget;
        },
        getPercentage: function () {
            return data.percentage;
        },
        getPercentages: function () {
            const percentages = data.items.exp.map(exp => {
                //console.log(exp.percentage)
                return exp.percentage;
            })
            return percentages;
        },
        getTotal: function (type) {
            return data.totals[type];
        },
        publicInitData: function () {
            initData();
        },
        saveData: function () {

            localStorage.setItem('data', JSON.stringify(data));
            //console.log(localStorage);
        },
        clearData: function () {
            //localStorage.removeItem('data');
            resetData();
        },
        testing: function () {
            return data;
        }
    }
})();



//-----------------------------       UI              ---------------------------------




var UIController = (function () {
    var DOMStrings = {
        typeInput: '.add__type',
        descriptionInput: '.add__description',
        valueInput: '.add__value',
        addButton: '.add__btn',
        incList: '.income__list',
        expList: '.expenses__list',
        budgetDisplay: '.budget__value',
        incomeDisplay: '.budget__income--value',
        expenseDisplay: '.budget__expenses--value',
        percentageDisplay: '.budget__expenses--percentage',
        percentagesDisplay: '.item__percentage',
        itemsContainer: '.container',
        typeSelector: '.add__type',
        inputsContainer: '.add__container',
        monthLabel: '.budget__title--month',
        resetButton: '.budget__clear--button',
        saveButton: '.budget__save--button ',
        savedPopup: '.popup__saved'
    }

    var generateHtmlString = function (type, item) {
        var html, newHtml;
        //console.log(item);
        if (type === 'inc') {
            html = '<div class="item income " id="inc-%id%"><div class="item__description">%des%</div><div class="right clearfix"><div class="item__value"> %val%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
        }
        else if (type === 'exp') {
            html = '<div class="item expense clearfix" id="exp-%id%"><div class="item__description">%des%</div><div class="right clearfix"><div class="item__value"> %val%</div><div class="item__percentage">%per%%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            html = html.replace('%per%', item.percentage);
        }
        newHtml = html.replace('%id%', item.id);
        newHtml = newHtml.replace('%des%', item.description);
        newHtml = newHtml.replace('%val%', formatNumber(item.value, type));

        return newHtml;

    }
    var clearFields = function () {
        var fields, fieldsArray;
        fields = document.querySelectorAll(DOMStrings.descriptionInput + ',' + DOMStrings.valueInput);
        fieldsArray = Array.prototype.slice.call(fields);
        fieldsArray.forEach(element => {
            element.value = "";
        });
        fields[0].focus();
    }
    var formatNumber = function (number, type) {
        var sign;
        number = Math.abs(number);
        number = number.toFixed(2);
        number = number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        //if (type === 'exp')
        //  number = '-' + number;
        //console.log(number)
        if (number == 0)
            sign = '';
        else if (type === 'inc')
            sign = '+';
        else
            sign = '-';

        return sign + number;

    }
    var animateDeleteListItem = function (item) {
        let idType = item.id.split('-')[0];
        idType === 'inc' ? idType = '.income' : idType = '.expense';

        if (item.className.includes('expense')) {
            item.style.animation = 'removeExpense 0.3s ease-out';
        }
        else {
            item.style.animation = 'removeIncome 0.3s ease-out';
        }

        animateListMoveUp(idType, item);


    }

    var animateListMoveUp = function (idType, item) {
        const selector = '.item' + idType;
        let items = document.querySelectorAll(selector);
        const position = Array.from(item.parentNode.children).indexOf(item);
        console.log(position)
        items.forEach((item, index) => {

            if (index > position) {
                console.log(`index: ${index}   id: ${position}`);
                item.classList.add('move-up');
                console.log(item.classList.contains('move-up'))
            }

        })

        setTimeout(() => {
            items = document.querySelectorAll(selector);
            //console.log(idType)
            items.forEach(item => {
                console.log(item)
                if (item.classList.contains('move-up'))
                    item.classList.remove('move-up');
            })
        }, 300);
    }


    var addListItem = function (type, item) {
        if (item && type) {
            var htmlString, DOMList;
            DOMList = document.querySelector(DOMStrings[type + 'List']);
            htmlString = generateHtmlString(type, item);
            DOMList.insertAdjacentHTML('beforeend', htmlString)
            clearFields();
        }

    }


    return {
        getDOMStrings: function () {
            return DOMStrings;
        },

        getInput: function () {
            return {
                type: document.querySelector(DOMStrings.typeInput).value,
                description: document.querySelector(DOMStrings.descriptionInput).value,
                value: parseFloat(document.querySelector(DOMStrings.valueInput).value)
            }
        },

        publicAddListItem: function (type, item) {
            addListItem(type, item)
        },

        deleteListItem: function (idString) {
            var elementToRemove = document.getElementById(idString);
            //let position = elementToRemove.parentNode.indexOf(elementToRemove);


            //console.log(i);
            setTimeout(() => { elementToRemove.parentNode.removeChild(elementToRemove); }, 300);
            animateDeleteListItem(elementToRemove);

        },
        updateListItemPercentages: function (dataPercentages) {
            setTimeout(() => {
                //console.log(dataPercentages)
                const percentages = document.querySelectorAll(DOMStrings.percentagesDisplay);
                if (percentages)
                    percentages.forEach((percentage, index) => {
                        if (dataPercentages[index] !== -1)
                            percentage.textContent = `${dataPercentages[index]}%`;
                        else
                            percentage.textContent = `0%`
                    })
            }, 350)


        },

        displayBudget: function (dataToDisplay) {
            const { budget, percentage, income, expense } = dataToDisplay;
            var type = dataToDisplay.budget > 0 ? 'inc' : 'exp';
            document.querySelector(DOMStrings.budgetDisplay).innerHTML = formatNumber(budget, type);
            document.querySelector(DOMStrings.incomeDisplay).innerHTML = formatNumber(income, 'inc');
            document.querySelector(DOMStrings.expenseDisplay).innerHTML = formatNumber(expense, 'exp');
            document.querySelector(DOMStrings.percentageDisplay).innerHTML = `${percentage}%`;
        },

        displayItems: function (items) {
            //const [incomeList, expenseList] = document.querySelectorAll(DOMStrings.incList, DOMStrings.expList);
            //{inc[],exp[]}

            items.inc.forEach(item => {
                addListItem('inc', item)
            })
            items.exp.forEach(item => {
                addListItem('exp', item)
            })

        },
        changeMarkColor: function (event) {
            //console.log(event);

            var fieldsContainer;
            fieldsContainer = document.querySelector(DOMStrings.inputsContainer);
            if (event.target.value === 'exp') {
                fieldsContainer.classList.add('red');
                fieldsContainer.classList.remove('green');
            }

            else {
                fieldsContainer.classList.add('green');
                fieldsContainer.classList.remove('red');
            }


        },
        displayMonth: function () {
            var date, month, year, months;
            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            date = new Date();
            month = date.getMonth();
            year = date.getFullYear();
            document.querySelector(DOMStrings.monthLabel).textContent = `${months[month]} ${year}`;
        },

        clearAll: function () {
            document.querySelector(DOMStrings.incList).innerHTML = '';
            document.querySelector(DOMStrings.expList).innerHTML = '';
            this.displayBudget({
                budget: 0,
                percentage: 0,
                income: 0,
                expense: 0
            })
            document.querySelector(DOMStrings.descriptionInput).focus();
        },
        displaySavedPopup: function () {
            const popup = document.querySelector(DOMStrings.savedPopup);
            popup.classList.toggle('visible');
            setTimeout(() => {
                popup.classList.toggle('visible');
            }, 2000);
        }
    }
})();




//--------------------       CONTROLLER        ----------------------------------------------------- 




var controller = (function (budgetCtrl, UICtrl) {

    var setupEventListeners = function () {
        var DOMStrings = UICtrl.getDOMStrings();
        document.querySelector(DOMStrings.addButton).addEventListener('click', ctrlAddItem);
        document.addEventListener('keypress', function (event) {
            if (event.keyCode === 13 || event.which === 13)
                ctrlAddItem();
        });
        document.querySelector(DOMStrings.itemsContainer).addEventListener('click', ctrlDeleteItem);
        document.querySelector(DOMStrings.typeSelector).addEventListener('change', UICtrl.changeMarkColor);
        document.querySelector(DOMStrings.resetButton).addEventListener('click', resetBudget);
        document.querySelector(DOMStrings.saveButton).addEventListener('click', saveData);
    }

    var ctrlAddItem = function () {
        var input, newItem;
        input = UICtrl.getInput();
        if (input.description != '' && !isNaN(input.value)) {
            newItem = budgetCtrl.addNewItem(input.type, input.description, input.value);
            UICtrl.publicAddListItem(input.type, newItem);
            updateBudget();
            UICtrl.updateListItemPercentages(budgetCtrl.getPercentages());
        }
        else return;
    }
    var saveData = function () {
        budgetCtrl.saveData();
        UICtrl.displaySavedPopup();
    }

    var ctrlDeleteItem = function (event) {
        var deletedItemString, deletedItemArray, deletedItemId, deletedItemType;
        if (event.target.parentNode.parentNode.parentNode.parentNode.id)
            deletedItemString = event.target.parentNode.parentNode.parentNode.parentNode.id;
        else
            return
        //console.log(deletedItemString);
        if (deletedItemString) {
            deletedItemArray = deletedItemString.split('-');
            deletedItemId = parseInt(deletedItemArray[1]);
            deletedItemType = deletedItemArray[0];
            //console.log(deletedItemId + ' ' + deletedItemType);
            budgetCtrl.deleteItem(deletedItemType, deletedItemId);
            UICtrl.deleteListItem(deletedItemString);
            updateBudget();
            UICtrl.updateListItemPercentages(budgetCtrl.getPercentages());
        }

    }

    var resetBudget = function () {
        budgetCtrl.clearData();
        //budgetCtrl.publicInitData();
        UICtrl.clearAll();
    }

    var updateBudget = function () {
        var budget = budgetCtrl.getbudget();
        var percentage = budgetCtrl.getPercentage();
        var income = budgetCtrl.getTotal('inc');
        var expense = budgetCtrl.getTotal('exp');
        var dataToDisplay = {
            budget: budget,
            percentage: percentage,
            income: income,
            expense: expense
        }
        UICtrl.displayBudget(dataToDisplay);
    }

    return {
        init: function () {
            setupEventListeners();
            UICtrl.displayMonth();
            budgetCtrl.publicInitData();
            UICtrl.displayBudget({
                budget: budgetCtrl.getbudget(),
                percentage: budgetCtrl.getPercentage(),
                income: budgetCtrl.getTotal('inc'),
                expense: budgetCtrl.getTotal('exp')
            })
            UICtrl.displayItems(budgetCtrl.getItems());
            //setInterval(budgetCtrl.saveData, 10000);
        }
    }

})(budgetController, UIController);

controller.init();