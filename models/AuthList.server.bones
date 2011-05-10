// Override parse for AuthList collection. Calls `parse` from above on
// each model, stripping private attributes.
models['AuthList'].prototype.parse = function(resp) {
    return _.map(resp, this.model.prototype.parse);
};
