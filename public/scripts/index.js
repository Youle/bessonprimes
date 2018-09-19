require.config({
    paths: {
        'jquery': 'lib/jquery.min',
        'text': 'lib/text',
        'tpl': '../views/data'
    }
});
require(['jquery', 'text!tpl/sell_form_row.ejs', 'text!tpl/sell_table.ejs', 'text!tpl/sell_table_row.ejs'], function($, sellFormRowTpl, sellsTableTpl, sellsTableRowTpl) {
    var Sells = {
        selectors: {
            container: '.js-main-container',
            editRow: '.js-sells-table-edit-row',
            saveRow: '.js-sells-table-save-row',
            tableRow: '.js-sells-table-row',
            rowInputSell: '.js-sells-table-input-value',
            rowInputPaid: '.js-sells-table-input-paid',
            deleteEntry: '.js-delete-entry'
        },
        buildTable: function(sells) {
            var $rowsTmp = $('<div>');
            _.each(sells.data, function(sell, sellerId) {
                $rowsTmp.append(_.template(sellsTableRowTpl)({data: sell, seller: _.extend({id: sellerId}, Sells.sellers[sellerId])}))
            });
            return _.template(sellsTableTpl)({title: sells.title, rows: $rowsTmp.html(), id: sells.id})
        },
        build: function(res) {
            Sells.sells = res ? res.data : Sells.sells;
            $(Sells.selectors.container).empty();
            _.each(Sells.sells, function(item) {
                $(Sells.selectors.container).append(Sells.buildTable(item));
            });
        },
        getData: function() {
            return $.get('/sells');
        },
        displayRowToForm: function(e) {
            e.stopPropagation();
            var $row = $(this).closest(Sells.selectors.tableRow);
            $row.addClass('is-editable');
        },
        saveRow: function(e) {
            e.stopPropagation();
            var $row = $(this).closest(Sells.selectors.tableRow);
            $(this).addClass('is-loading');
            var id = $row.closest('table').attr('data-target');
            var sellerId = $row.attr('data-target');
            $.ajax({
                type: 'POST',
                data: JSON.stringify({
                    value: $row.find(Sells.selectors.rowInputSell).val(),
                    paid: $row.find(Sells.selectors.rowInputPaid).val()
                }),
                contentType: 'application/json',
                url: '/sell/' + id + '/' + sellerId
            }).done(function(res) {
                Sells.build(res)
            }).fail(Sells.reload)
        },
        reload: function() {
            location.reload();
        },
        deleteEntry: function() {
            $.ajax({
                type: 'DELETE',
                url: '/sell/' + $(this).attr('data-target')
            }).done(Sells.build).fail(Sells.reload)
        },
        bindEvents: function() {
            $('body').on('click.editRow', Sells.selectors.editRow, Sells.displayRowToForm)
                .on('click.saveRow', Sells.selectors.saveRow, Sells.saveRow)
                .on('click.deleteEntry', Sells.selectors.deleteEntry, Sells.deleteEntry);
        },
        initialize: function(sellers) {
            Sells.sellers = sellers;
            Sells.getData().done(Sells.build);
            Sells.bindEvents()
        }
    };
    var Form = {
        selectors: {
            tableBody: '.js-table-form-data-body',
            titleInput: '.js-form-title',
            save: '.js-form-save',
            sellInput: '.js-form-table-input',
            form: '.js-add-table-form',
            show: '.js-form-show-button'
        },
        build: function() {
            $(Form.selectors.tableBody).empty();
            $(Form.selectors.titleInput).val('');
            _.each(Form.sellers, function(seller) {
                $(Form.selectors.tableBody).append(_.template(sellFormRowTpl)(seller));
            })
        },
        getFormData: function() {
            var toReturn = {data: {}, title: $(Form.selectors.titleInput).val()};
            _.each(Form.sellers, function(seller) {
                toReturn.data[seller.id] = {
                    value: $(Form.selectors.sellInput + '[data-target="' + seller.abbr + '"]').val(),
                    paid: 0
                };
            });
            return toReturn;

        },
        saveTable: function() {
            $(Form.selectors.form).addClass('is-invisible');
            $(Form.selectors.show).addClass('is-loading');
            $.ajax({
                type: 'POST',
                data: JSON.stringify(Form.getFormData()),
                contentType: 'application/json',
                url: '/add/table'
            }).done(function(res) {
                console.log(res)
                $(Form.selectors.show).removeClass('is-loading');
                Sells.build(res);
            }).fail(Sells.reload)
        },
        show: function() {
            Form.build();
            $(Form.selectors.form).removeClass('is-invisible');
        },
        bindEvents: function() {
            $('body').on('click.saveForm', Form.selectors.save, Form.saveTable)
                .on('click.showForm', Form.selectors.show, Form.show)
        },
        initialize: function(res) {
            Form.sellers = res.sellers;
            Form.build();
            Form.bindEvents();
        }
    }
    $.get('/save').done(function(res) {
        Form.initialize(res);
        Sells.initialize(res.sellers);
    })
});