// Override parse for Users collection. Calls `parse` from above on
// each model, stripping private attributes.
models['Users'].prototype.parse = function(resp) {
    return _.map(resp, this.model.prototype.parse);
};
