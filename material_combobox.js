(function ($) {
    var count = 0;
    var optionsArray = [];

    $.fn.materialCombobox = function (action, options) {
        var options = $.extend({
            items: [],
            label: undefined,
            float: true,
            multiSelect: false,
            forceMatch: false,
            showCheckboxes: false,
            onSelectionChanged: function () { }
        }, options);

        if (action === "value") {
            var element = $(this);
            if (!element.hasClass('material-combobox')) return 'Selected element is not a material combobox';  // already initialized

            if (element.hasClass('no-multi')) {
                return getValue(element);
            } else {
                return getValuesMulti(element);
            }
        }

        return this.each(function (item) {
            var element = $(this);
            var parent = element.parent();

            if (action === "init") {
                if (element.hasClass('material-combobox')) return;  // already initialized

                optionsArray[count] = options;

                // Remove the original element from the DOM
                element.remove();

                // Create the structure of the component first
                var combobox = $('<div></div>')     // create the parent element
                    .addClass('material-combobox')
                    .addClass(options.float ? 'float' : 'no-float')
                    .addClass(options.multiSelect ? 'multi' : 'no-multi')
                    .addClass(options.showCheckboxes ? 'checkboxes' : 'no-checkboxes')
                    .addClass(element.attr("class"))
                    .attr('id', (element.attr("id")))
                    .attr('count', count++);
                    
                combobox.append(                    // add an input, for the user to type into
                    $('<input></input>')
                        .attr('type', 'text')
                        .focusin(function () { focus(combobox); })
                        .focusout(function () { unfocus(combobox); })
                        .on('change keyup paste', function (e) {
                            if (e.type === "change" && options.forceMatch) {
                                var matches = false;
                                if (!options.multiSelect) {
                                    matches = checkIfMatch(combobox, e.target.value);
                                } else {
                                    matches = checkIfMatchMulti(combobox, getPossibleValuesMulti(combobox));
                                }
                                if (!matches) {
                                    e.target.value = '';
                                }
                            }
                            
                            if (e.type !== 'change') {
                                if (!options.multiSelect) {
                                    filter(combobox, e.target.value);
                                } else {
                                    updateMultiList(combobox, getFilterValueMulti(combobox));
                                    filterMulti(combobox, getFilterValueMulti(combobox));
                                }
                            }

                            if (e.target.value !== '') combobox.addClass('has-value')
                            else combobox.removeClass('has-value');
                        })
                );

                combobox.append(
                    '<svg class="spinner" width="18px" height="18px" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">' +
                    '    <circle class="path" fill="none" stroke-width="2" stroke-linecap="round" cx="9" cy="9" r="6"></circle>' +
                    '</svg>'
                );

                if (options.label !== undefined) {
                    combobox.append(                // add a div, which will be the label
                        $('<div></div>')
                            .addClass('material-combobox-label')
                            .text(options.label)
                    );
                } else {
                    //TODO: Combobox should work without label
                }

                // Now we append each option to the options list
                combobox.materialMenu('init', {
                    items: generateMenuItems(combobox, options.items, options)
                });

                // Now we can add our combobox to the DOM
                parent.append(combobox);
            }

            if (action === "addItems") {
                var element = $(this);
                if (!element.hasClass('material-combobox')) return 'Selected element is not a material combobox';  // already initialized
                element.materialMenu('add items', {
                    items: generateMenuItems(element, options.items, options)
                });

                return this;
            }

            if (action === "updateItems") {
                var element = $(this);
                if (!element.hasClass('material-combobox')) return 'Selected element is not a material combobox';  // already initialized
                element.materialMenu('update items', {
                    items: generateMenuItems(element, options.items, options)
                });

                return this;
            }

            if (action === "setLoading") {
                var element = $(this);
                if (!element.hasClass('material-combobox')) return 'Selected element is not a material combobox';  // already initialized
                if (options.loading) element.addClass('indeterminate');
                else element.removeClass('indeterminate');

                return this;
            }

            if (action === "clear") {
                var element = $(this);
                if (!element.hasClass('material-combobox')) return 'Selected element is not a material combobox';  // already initialized

                element.attr('value', '');
                element.find('input').val('');
            }
        });
    };

    function focus(combobox) {
        combobox.addClass('focus');
        combobox.materialMenu('open');
    }

    function unfocus(combobox) {
        combobox.removeClass('focus');
    }

    function filter(combobox, value) {
        combobox.materialMenu('filter', { filterValue: value });
    }

    function filterMulti(combobox, values) {
        var value = values[values.length - 1];
        if (checkIfMatch(combobox, value) || value[value.length - 1] === ',') value = '';
        combobox.materialMenu('filter', { filterValue: value });
    }

    function checkIfMatch(combobox, value) {
        var possibleValues = combobox.materialMenu('get items')
            .map(function (item) { return item.text; });
        return possibleValues.includes(value);
    }

    function checkIfMatchMulti(combobox, values) {
        var possibleValues = combobox.materialMenu('get items')
            .map(function (item) { return item.text; });
        var matches = true;
        values.forEach(function (value) {
            if (!possibleValues.includes(value.text)) matches = false;
        });
        return matches;
    }

    function updateMultiInputText(combobox) {
        var val = combobox.materialMenu('get items')
            .filter(function (item) { return item.checked; })
            .map(function (item) { return item.text; })
            .reduce(function (a, b) { return a !== '' ? a + ', ' + b : b; }, '');
        combobox.find('input').val(val);
        if (val !== '') combobox.addClass('has-value');
        else combobox.removeClass('has-value');
    }
    
    function updateMultiList(combobox, values) {
        var items = combobox.materialMenu('get items');
        items.forEach(function (item) {
            item.checked = values.includes(item.text);
        });
        combobox.materialMenu('update items', { items: items });
    }

    function getValue(combobox) {
        return { text: combobox.find('input').val(), value: combobox.attr('value') };
    }

    function getValuesMulti(combobox) {
        return combobox.materialMenu('get items').filter(function (item) { return item.checked; }).map(function (item) { return { text: item.text, value: item.id }; });
    }

    function getPossibleValuesMulti(combobox) {
        var results = [];
        combobox.find('.options li').each(function () {
            var item = $(this).find('span').text();
            var value = $(this).val();
            results.push({ text: item, value: value });
        });
        return results;
    }

    function getFilterValueMulti(combobox) {
        return combobox.find('input').val().split(', ');
    }

    function generateMenuItems(combobox, items, options) {
        return items.map(function (item) {
            return {
                text: item.text,
                id: item.value,
                type: combobox.hasClass('multi') ? 'toggle' : 'normal',
                click: function () {
                    if (combobox.hasClass('multi')) {
                        updateMultiInputText(combobox);
                        optionsArray[combobox.attr('count')].onSelectionChanged(getValuesMulti(combobox));
                    } else {
                        combobox.find('input').val(item.text);
                        combobox.attr('value', item.value);
                        combobox.addClass('has-value');
                        optionsArray[combobox.attr('count')].onSelectionChanged(getValue(combobox));
                    }
                }
            };
        });
    }
}(jQuery));