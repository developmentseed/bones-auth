// AdminTableRowUser
// -----------------
// Custom table row for users.
if (views.AdminTableRow) view = views.AdminTableRow.extend({
    initialize: function(options) {
        _.bindAll(this, 'render');
        views.AdminTableRow.prototype.initialize.call(this, options);
    },
    render: function () {
        $(this.el).html(templates['AdminTableRowUser'](this.model));
        return this;
    }
});
