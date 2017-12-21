/**
 * 存储localStorage
 */
var setStore = function(name, content) {
    if (!name) return;
    if (typeof content !== 'string') {
        content = JSON.stringify(content);
    }
    window.localStorage.setItem(name, content);
}

/**
 * 获取localStorage
 */
var getStore = function(name) {
    if (!name) return;
    return JSON.parse(window.localStorage.getItem(name));
}

/**
 * 删除localStorage
 */
var removeStore = function(name) {
    if (!name) return;
    window.localStorage.removeItem(name);
}


var app = new Vue({
    el: '#app',
    data: {
        appName: 'BillSpliter',
        eaters: [],
        activeEater: {},
        orderingInput: '',
        otherInput: '',
        currentOrdering: [],
        currentOther: ''
    },
    created: function() {
        this.eaters = getStore('eaters') || [];
    },
    computed: {
        currentTotal: function() {
            // currentOrdering total
            var temp = 0;
            this.orderingInput.split(/[,，]/g).forEach(function(element) {
                temp += Number(element);
            })
            return temp;
        }
    },
    watch: {
        eaters: function(newVal) {
            setStore('eaters', newVal);
        }
    },
    methods: {
        addEater: function() {
            var vm = this;
            UIkit.modal.prompt('Name:', '').then(function(name) {
                console.log('Prompted:', name)
                if (name && name.trim()) {
                    var color = randomColor();
                    vm.eaters.push({
                        color: color,
                        name: name,
                        cost: 0,
                        orders: {}
                    })
                }
            });
        },
        deleteEater: function(index) {
            this.eaters.splice(index, 1);
        },
        switchActive: function(eater, index) {
            this.activeEater = {
                name: eater,
                index: index
            };
        },
        genOrdering: function() {
            var temp = [];
            this.orderingInput.split(/[,，]/g).forEach(function(element) {
                temp.push({
                    value: element,
                    eater: ''
                })
            })
            this.currentOrdering = temp;
        },
        genOther: function() {
            var temp = 0;
            this.otherInput.split(/[,，]/g).forEach(function(element) {
                temp += Number(element);
            })
            this.currentOther = temp;
        },
        checkPrice: function(e, value, index) {
            var eaterIndex = this.activeEater.index;
            if (e.target.checked) {
                this.currentOrdering[index]['eater'] = this.activeEater.name;
                this.eaters[eaterIndex]['orders'][index] = value;
            } else {
                this.currentOrdering[index]['eater'] = '';
                delete this.eaters[eaterIndex]['orders'][index];
            }

            // compute costs
            var personTotal = 0,
                personOther = 0;
            var orders = this.eaters[eaterIndex]['orders'];
            for (var key in orders) {
                personTotal += Number(orders[key]);
            }
            if (this.currentOther !== 0) {
                personOther = personTotal / this.currentTotal * this.currentOther;
            }
            this.eaters[eaterIndex]['cost'] = (personTotal + personOther).toFixed(2);
        }
    }
})