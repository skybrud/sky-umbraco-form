/**
 * Extending angular.element to achieve conditional fields and 
 * validation in Umbraco Forms without jQuery.
 *
 * Use this way to validate single field
 * angular.element(document).search('#specific-field').validate();
 *
 * use this way to validate entire form
 * angular.element(document).search('.contour form').validateForm();
 *
 * @author Filip Bruun Bech-Larsen, @filipbech
 **/
declare module angular {
	interface IAugmentedJQuery {
		search?(sel: string): IAugmentedJQuery;
		validate(): void;
	}
}
interface HTMLElement {
	name?: string;
	type?: string;
	checked?: boolean;
}

/* Set this */
var contourDateFormat = "dd-mm-yy";


angular.element.prototype.search = function(sel) {
	var invalidId=sel.match(/^#([0-9][\d\w-]+)/);
	// because contour spits out invalid Id's that the querySelectorAll-method wont accept
	if(invalidId){
		return angular.element(document.getElementById(invalidId[1]));
	}
	return angular.element(this[0].querySelectorAll(sel));
};

angular.element.prototype.hide = function() {
	if(!this[0]) {
		return this;
	}
	this[0].style.display = 'none';
	return this;
};

angular.element.prototype.show = function() {
	if(!this[0]) {
		return this;
	}
	this[0].style.display = '';
	return this;
};

angular.element.prototype.change = function(fn) {
	return this.on('change', fn);
};

angular.element.prototype.is = function(sel) {
	if (sel == ':checked') {
		return this[0].checked;
	}
	if ('matches' in document.documentElement) {
		return this[0].matches(sel);
	} else if('msMatches' in document.documentElement)  {
		return this[0].msMatches(sel);
	} else if('webkitMatches' in document.documentElement)  {
		return this[0].webkitMatches(sel);
	} else {
		throw('only :checked is supported in old browsers!');
	}
};

angular.element.prototype.each = function(fn) {
	angular.forEach(this,function(value,key) {
		var bound = fn.bind(value);
		bound(key, angular.element(value));
	});
	return this;
};

angular.element.prototype.closest = function(sel) {
	var i=0;
	if(!this[0]) {
		return angular.element();
	}
	//Use the ES6 native-method if available
	if('closest' in document.body) {
		return angular.element(this[0].closest(sel));
	}

	var parent = this[0].parentElement;
	var res;
	while(i<50) {
		if(parent) {
			if(angular.element(parent).is(sel)) {
				res=parent;
				break;
			}
			parent=parent.parentElement;
		} else {
			break;
		}
		i++;
	}
	return angular.element(res);
};


angular.element.prototype.validate = function() {
	var fieldLists={};
	angular.forEach(this, function(f) {
		var field = angular.element(f);
		var errorMsgEle = angular.element(document).search('span[data-valmsg-for="'+field[0].name+'"]');
		var requiredMsg = field.attr('data-val-required') || field.attr('data-val-requiredcb') || field.attr('data-val-requiredlist') || '';
		var regexMsg = field.attr('data-val-regex') || '';
		var regex =  new RegExp(field.attr('data-regex'));
		var partOfList = !!field.attr('data-val-requiredlist'); /* radioButtonList or checkBoxList */

		var changeEvents = 'change blur';

		if(partOfList) {
			/* Add the field to the corresponding part of the fieldLists-object (create if not exists) */
			var name = field[0].name;
			if(!fieldLists[name]) {
				fieldLists[name]=[];
			}
			fieldLists[name].push(field[0]);

			/* Only validate on change (not blur) so we dont see the error when tabbing from first to second item in same list */
			changeEvents = 'change';
		}

		/* Validate the field */
		field.on(changeEvents,function() {
			var value = field.val();

			if(partOfList) {
				/* loop through elements in the same list, and set value to true when you see a checked item (start out false)*/
				value=false;
				angular.forEach(fieldLists[name], function(item) {
					if(item.checked) {
						value=true;
					}
				});
			} else if(field[0].type === 'checkbox') {
				/* if field is a single checkbox, set the value to the checked boolean */
				value=field[0].checked;
			}


			if(requiredMsg && !value) {
				/* if the field is required and value not present, show the message and flag as an error */
				errorMsgEle.html(requiredMsg);
				field.data('error',true);
			}
			else if(regexMsg && value && !regex.test(value)) {
				/* if the field should and doesn't pass a regex-rest, show the message and flag as an error */
				errorMsgEle.html(regexMsg);
				field.data('error',true);
			} else {
				/* if no errors, empty the displayed error message and remove error-flag */
				errorMsgEle.html('');
				field.data('error',false);
			}
		});
	});
};

angular.element.prototype.validateForm = function() {
	angular.forEach(this, function(f) {
		var form = angular.element(f);

		if(!form.data('validation-added')) {
			form.data('validation-added',true);
			var formFields = form.search('[data-val="true"]');
			formFields.validate();

			angular.element(form).on('submit', function(e) {
				formFields.triggerHandler('change');
				var errors=false;

				angular.forEach(formFields, function(field) {
					if(angular.element(field).data('error')) {
						errors=true;
					}
				});
				if(errors) {
					e.preventDefault();
					return false;
				} else {
					return true;
				}
			});

		}
	});
};