// AdminDropdownUser
// -----------------
// User management dropdown.
if (views.AdminDropdown) view = views.AdminDropdown.extend({
    icon: 'user',
    events: _.extend({
        'click a[href=#logout]': 'logout',
        'click a[href=#user]': 'user',
        'click a[href=#userCreate]': 'userCreate',
        'click a[href=#userView]': 'userView'
    }, views.AdminDropdown.prototype.events),
    links: [
        { href: '#user', title: 'My account' },
        { href: '#userCreate', title: 'Create user' },
        { href: '#userView', title: 'View users' },
        { href: '#logout', title: 'Logout' },
    ],
    initialize: function(options) {
        this.title = this.model.id;
        _.bindAll(this, 'logout', 'user', 'userCreate', 'userView');
        views.AdminDropdown.prototype.initialize.call(this, options);
    },
    logout: function() {
        this.model.authenticate('logout', {}, { error: this.admin.error });
        return false;
    },
    user: function() {
        new views.AdminPopupUser({
            title: 'My account',
            model: this.model,
            admin: this.admin
        });
        return false;
    },
    userCreate: function() {
        new views.AdminPopupUser({
            title: 'Create user',
            model: new this.model.constructor(),
            admin: this.admin
        });
        return false;
    },
    userView: function() {
        new views.AdminTable({
            title: 'Users',
            collection: new models.Users(),
            admin: this.admin,
            header: [
                {title:'Username'},
                {title:'Actions', className:'actions'}
            ],
            rowView: views.AdminTableRowUser
        });
        return false;
    }
});
