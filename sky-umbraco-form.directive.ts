(function() {
	'use strict';

	angular.module('skyUmbracoForm').directive('skyUmbracoForm', skyUmbracoFormDirective);

	function skyUmbracoFormDirective() {
		var directive = {
			restrict: 'E',
			scope: {
				formGuid: '='
			},
			bindToController: true,
			controller: skyUmbracoFormController,
			controllerAs: 'skyUmbracoFormCtrl',
			template: '<sky-compile content="{{skyUmbracoFormCtrl.markup}}"></sky-compile>'
		};

		skyUmbracoFormController.$inject = ['$http', 'skyPath', '$element'];
		function skyUmbracoFormController($http, skyPath, $element) {
			var _this = this;

			$element.addClass('loading');
		
			// Get initial form, parse markup to handleMarkup
			$http({
				method: 'GET',
				url: skyPath.get() + '/formrender/',
				withCredentials: true,
				params: {
					guid: _this.formGuid
				}
			}).then(handleMarkup);

			function handleMarkup(markup) {
				$element.removeClass('loading');
				_this.markup = markup.data;

				// Timeout needed to make sure $compile has run, so we can query the DOM
				setTimeout(() => {

					// Look for script-tags, and run them (they are inserted passively by 
					// $compile, so we eval contents or inser script-tag via appendChild)
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

					// Specialcase for dealing with how Umbraco-forms does multistep-forms
					// Sets a direction-variable based on the clicked button. 
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

					// Take over form-submission
					$element.find('form').on('submit', function(event) {
						event.preventDefault();
						$element.addClass('loading');

						var formData:any = new FormData();

						// Loop through all form-fields and store the values in formData-instance
						angular.forEach(event.target.querySelectorAll('input, textarea, select'), function(field) {
							// Specialcase for dealing with multistep Umbraco-forms
							// Only send input[type=submit]-values of the clicked button
							if (field.type == 'submit' && field.name != direction) {
								return;
							}

							// Handle file-uploads
							if(field.type === 'file') {
								// Not supported in polyfilled FormData()
								if (formData.fake) { 
									alert('Your browser does not support file-uploads. Remaining fields are submitted!');
									return;
								}
								// Loop through selected files and add to formData-instance
								Array.prototype.forEach.call(field.files, function(file) {
									formData.append(field.name, file);
								});
								return;
							}

							// Handle checkboxes + radio-buttons
							if (field.type === 'checkbox' || field.type === 'radio')  {
								if (field.checked) {
									formData.append(field.name, field.value);
								}
								return;
							} 

							// Handle remaining regular fields
							formData.append(field.name, field.value);
						});

						// Actually POST the data (with cookies) and send response to handleMarkup
						$http({
							method: 'POST',
							data: formData,
							withCredentials: true,
							url: skyPath.get() + angular.element(event.target).attr('action'), /* Read the action-attr from form-element */
							headers: {
								'Content-Type': undefined
							}
						}).then(handleMarkup);
						
						return false;
					});

				}, 0);
			}
		}
		return directive;
	}
})();