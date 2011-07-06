Bones.Command.options['secret'] = {
    'description': 'Secret key.'
};

Bones.Command.options['adminEmail'] = {
    'title': 'adminEmail=[email]',
    'description': 'Email address used to send administrative emails.',
    'default': 'test@example.com'
};

Bones.Command.options['passwordResetSubject'] = {
    'title': 'passwordResetSubject=[subject]',
    'description': 'Subject used for password reset emails.',
    'default': 'Your password reset request'
};
