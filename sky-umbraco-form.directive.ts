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

		skyUmbracoFormController.$inject = ['$http', 'skyPath', '$element'];
		function skyUmbracoFormController($http, skyPath, $element) {
			var _this = this;

			$element.addClass('loading');

			var path = skyPath.get();
			
			$http({
				method: 'GET',
				url: path + '/formrender/',
				withCredentials: true,
				params: {
					guid: _this.formGuid
				}
			}).then((result) => handleMarkup(result.data));

			function handleMarkup(markup) {
				$element.removeClass('loading');
				_this.markup = markup;

				setTimeout(()=>{
					var scripttags = $element.find('script');
					angular.forEach(scripttags, function(scripttag) {
						if (scripttag.src) {
							var s = document.createElement('script');
							s.src = scripttag.src;
							document.body.appendChild(s);
						} else {
							eval(scripttag.innerHTML);
						}
					});

					var form = $element.find('form');

					// specialcase for dealing with multistep-forms
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

						var formData:any = new FormData();

						angular.forEach(form[0].querySelectorAll('input, textarea, select'), function(field) {
							if (field.type == 'submit' && field.name != direction) {
								// specialcase for dealing with multistep-forms
								return;
							}

							//handle specialcase: fileupload
							if(field.type === 'file') {
								if (formData.fake) {
									alert('Your browser does not support file-uploads. Remaining fields are submitted!');
									return;
								}
								Array.prototype.forEach.call(field.files, function(file) {
									formData.append(field.name, file);
								});
								return;
							}

							//handle specialcase: checkbox+radio
							if (field.type === 'checkbox' || field.type === 'radio')  {
								if (field.checked) {
									formData.append(field.name, field.value);
								}
								return;
							} 

							// all other fields
							formData.append(field.name, field.value);
						});

						$element.addClass('loading');
						$http({
							method: 'POST',
							data: formData,
							withCredentials: true,
							url: path + form.attr('action'),
							headers: {
								'Content-Type': undefined
							}
						}).then((result) => handleMarkup(result.data));
						
						return false;
					});

				}, 0);

			}

		}

		return directive;
	}
})();