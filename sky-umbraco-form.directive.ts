(function() {
	'use strict';

	angular.module('skyUmbracoForm').directive('skyUmbracoForm', skyUmbracoFormDirective);

	skyUmbracoFormDirective.$inject = ['skyPath'];
	function skyUmbracoFormDirective(skyPath) {
		var directive = {
			restrict: 'E',
			scope:{
				formGuid: '='
			},
			bindToController: true,
			controller: skyUmbracoFormController,
			controllerAs: 'skyUmbracoFormCtrl',
			templateUrl: '/sky-umbraco-form/sky-umbraco-form.template.html'
		};

		skyUmbracoFormController.$inject = ['$http', 'skyPath', '$element', '$httpParamSerializerJQLike'];
		function skyUmbracoFormController($http, skyPath, $element, $httpParamSerializerJQLike) {
			var _this = this;

			$element.addClass('loading');

			var path = skyPath.get();
			
			$http({
				method: 'GET',
				url: path+'/formrender/',
				withCredentials:true,
				params: {
					guid: _this.formGuid
				}
			}).then(function(result) {
				handleMarkup(result.data);
			});

			function handleMarkup(markup) {
				$element.removeClass('loading');
				_this.markup = markup;

				setTimeout(function() {

					var scripttags = $element.find('script');
					angular.forEach(scripttags, function(scripttag) {
						eval(scripttag.innerHTML);
					});

					var form = $element.find('form');

					var buttons = angular.element($element[0].querySelector('input[type=submit]'));

					var direction = '';

					angular.forEach(buttons, function(button) {
						if(button.name === 'next' || button.name === 'submit') {
							direction = button.name;
						}
						angular.element(button).on('click', function() {
							direction = button.name;
						});
					});


					form.on('submit', function(event) {
						event.preventDefault();

						var data = {};
						angular.forEach(form[0].querySelectorAll('input, textarea, select'), function(field) {
							if (field.type == 'submit' && field.name != direction) {
								return;
							}
							data[field.name] = field.value;						
						});

						$element.addClass('loading');
						$http({
							method: 'POST',
							data: $httpParamSerializerJQLike(data),
							withCredentials: true,
							url: path + form.attr('action'),
							headers: {
								'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
							}
						}).then(function(result) {
							handleMarkup(result.data);
						});
						
						return false;
					});

				}, 0);

			}

		}

		return directive;
	}

})();