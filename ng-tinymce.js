angular.module('ng.tinymce', ['ngDialog'])
    .value('ngTinymceConfig', {
        toolbar: false,
        force_p_newlines: true,
        keep_styles: false,
        valid_elements: "a[href],b,br,p[align],u,font[color],img[src|alt|align],small,ul,ol,li,strike,blockquote",
        plugins: ["link code wordcount legacyoutput"],
        menubar: "tools format insert",
        convert_urls: false,
        relative_urls: true,
        entity_encoding: "raw",
        height: 300
    })
    .directive('ngTinymce', ['ngTinymceConfig', 'ngDialog', function (ngTinymceConfig, $dialog) {
        ngTinymceConfig = ngTinymceConfig || {};
        var generatedIds = 0;
        return {
            priority: 10,
            require: 'ngModel',
            link: function (scope, elm, attrs, ngModel) {
                var options, tinyInstance, configSetup,
                    updateView = function () {
                        ngModel.$setViewValue(elm.val());
                        if (!scope.$root.$$phase) {
                            scope.$apply();
                        }
                    };

                // generate an ID if not present
                if (!attrs.id) {
                    attrs.$set('id', 'ngTinymce' + generatedIds++);
                }

                if (attrs.ngTinymce) {
                    console.log(attrs.ngTinymce);
                    angular.extend(ngTinymceConfig, scope.$eval(attrs.ngTinymce));
                }

                // make config'ed setup method available
                if (ngTinymceConfig.setup) {
                    configSetup = ngTinymceConfig.setup;
                    delete ngTinymceConfig.setup;
                }

                options = {
                    // Update model when calling setContent (such as from the source editor popup)
                    setup: function (ed) {
                        var args;
                        ed.on('init', function (args) {
                            ngModel.$render();
                            ngModel.$setPristine();
                        });
                        // Update model on button click
                        ed.on('ExecCommand', function (e) {
                            ed.save();
                            updateView();
                        });
                        // Update model on keypress
                        ed.on('KeyUp', function (e) {
                            ed.save();
                            updateView();
                        });
                        // Update model on change, i.e. copy/pasted text, plugins altering content
                        ed.on('SetContent', function (e) {
                            if (!e.initial && ngModel.$viewValue !== e.content) {
                                ed.save();
                                updateView();
                            }
                        });
                        ed.on('blur', function (e) {
                            if (!options.inline) {
                                elm.triggerHandler("blur");
                            }
                        });
                        // Update model when an object has been resized (table, image)
                        ed.on('ObjectResized', function (e) {
                            ed.save();
                            updateView();
                        });

                        ed.addMenuItem('myitem', {
                            text: 'Click here button',
                            context: 'insert',
                            onclick: function () {
                                $dialog.open({
                                    template: '<form name="mainform" method="POST" ng-submit="insert()"> <fieldset> <legend>Insert Click Here Button</legend> <div class="form-group"> <label>Target URL</label> <input type="text" class="form-control" ng-model="data.url " id="url " ng-required="true" placeholder="Target URL"/> </div><div class="form-group"> <label>Alt text for image</label> <input type="text" class="form-control" ng-model="data.alt" id="alt" placeholder="Alt text for image"/> </div><div class="form-group"> <label>Image URL</label> <input type="url" class="form-control" ng-model="data.img" id="img" ng-required="true" placeholder="Image URL"/> </div><div class="form-group"> <button type="submit" ng-disabled="!mainform.$valid" class="btn btn-primary"><i class="fa fa-check-circle"></i> Insert</button> </div></fieldset></form>',
                                    plain: true,
                                    controller: ['$scope', function ($scope) {
                                        $scope.data = {'url': '%auth%', 'img': 'http://i.imgur.com/fPtAGeP.png', 'alt': 'More information'};
                                        $scope.insert = function () {
                                            ed.insertContent('<p><a href="' + $scope.data.url + '"><img src="' + $scope.data.img + '" alt="' + $scope.data.alt + '"></a></p>');
                                            $scope.closeThisDialog();
                                        };
                                    }]
                                });
                            }
                        });


                        if (configSetup) {
                            configSetup(ed);
                        }
                    },
                    mode: 'exact',
                    elements: attrs.id
                };

                // extend options with initial ngTinymceConfig and options from directive attribute value
                angular.extend(options, ngTinymceConfig);

                setTimeout(function () {
                    tinymce.init(options);
                });

                ngModel.$render = function () {
                    if (!tinyInstance) {
                        tinyInstance = tinymce.get(attrs.id);
                    }
                    if (tinyInstance) {
                        tinyInstance.setContent(ngModel.$viewValue || '');
                    }
                };

                scope.$on('$destroy', function () {
                    if (!tinyInstance) {
                        tinyInstance = tinymce.get(attrs.id);
                    }
                    if (tinyInstance) {
                        tinyInstance.remove();
                        tinyInstance = null;
                    }
                });
            }
        };
    }]);