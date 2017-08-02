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
    computed: {
    	currentTotal: function() {
    		// currentOrdering total
    		var temp = 0;
    		this.orderingInput.split(',').forEach(function(element) {
    			temp += Number(element);
    		})
    		return temp;
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
        switchActive: function(eater, index) {
            this.activeEater = {
                name: eater,
                index: index
            };
        },
        genOrdering: function() {
            var temp = [];
            this.orderingInput.split(',').forEach(function(element) {
                temp.push({
                    value: element,
                    eater: ''
                })
            })
            this.currentOrdering = temp;
        },
        genOther: function() {
            var temp = 0;
            this.otherInput.split(',').forEach(function(element) {
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
            var personTotal = 0, personOther = 0;
            var orders = this.eaters[eaterIndex]['orders'];
            for (var key in orders) {
            	personTotal += Number(orders[key]);
            }
            if (this.currentOther !== 0) {
	           	personOther = personTotal/this.currentTotal*this.currentOther;
            }
            this.eaters[eaterIndex]['cost'] = (personTotal + personOther).toFixed(2);
        }
    }
})