module.exports = {
  getAllOrderStatuses: function (req, res, next) {
    OrderStatus.find().exec(function (err, statuses) {
      if(err){
        return res.serverError(err);
      }else{
        return res.ok({ statuses: statuses });
      }
    });
  },
};
