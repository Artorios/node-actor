(function() {
    var CZ = require('cz-actor');

    var User = (function() {
        function User() {
            this.actor = CZ.Actor({
                id: 'userActor',
                process: function(sender, message, promise) {
                    if (message.type === 'queryOne') {
                        this.actor.send('dbActor', {type: 'queryOne', name: 'User', query: message.query}).then(function(data) {
                            promise.resolve(data);
                        }, function(err) {
                            promise.reject(err);
                        });
                    }
                }.bind(this)
            });
            this.initialize();
        }


        User.prototype.initialize = function() {
            this.schema = {
                email: { type: String, unique: true, required: true },
                password: { type: String, required: true },
                firstname: {'type': String, required: true },
                lastname: {'type': String, required: true },
                created_at: { type: Date, required: true }
            };

            // /users get
            this.actor.send('apiActor', {
                type: 'route',
                request: {
                    method: 'GET',
                    url: '/users',
                    handlers: [
                        function(req, res, next) {
                            this.actor.send('dbActor', {type: 'query', name: 'User', query: {}}).then(function(results) {
                                res.json({success: true, users: results});
                            }, function(err) {
                                res.status(500);
                            });
                        }.bind(this)
                    ]
                }
            });

            // /users post
            this.actor.send('apiActor', {
                type: 'route',
                request: {
                    method: 'POST',
                    url: '/users',
                    handlers: [
                        function(req, res, next) {
                            var data = req.body;
                            data.created_at = new Date();
                            this.actor.send('dbActor', {type: 'create', name: 'User', data: data}).then(function(results) {
                                res.json({success: true, user: results});
                            }, function(err) {
                                res.status(500);
                                res.json({success: false});
                            });
                        }.bind(this)
                    ]
                }
            });
        }

        User.prototype.start = function() {
            this.actor.send('dbActor', {
                type: 'schema',
                name: 'User',
                schema: this.schema
            }).then(function(result) {
                this.model = result;
                // this.model.find({}, function(err, users) {
                //     console.log("Find all reuslt: ", users);
                // });
            }, function(err) {
                console.log(err);
            });

        };

        return User;
    })();

    module.exports = new User();

}).call(this);



