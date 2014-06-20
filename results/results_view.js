var template = require('../templates/results.hbs');

var ResultAnimator = function(options) {
  this.correct = options.totalScore;
  this.incorrect = options.totalAnswered - this.correct;
  this.$el = options.$el;
};

ResultAnimator.prototype.updateScore = function(correct, incorrect) {
  this.correct = correct;
  this.incorrect = options.incorrect;
};

ResultAnimator.prototype.displayResults = function() {
  this.render();
  this.correct = this.correct || 0;
  this.incorrect = this.incorrect || 0;
  this.$el.addClass('active');

  setTimeout(function() {
    this.resizePie(this.correct, this.incorrect);
  }.bind(this), 1000);
};

ResultAnimator.prototype.resetResults = function() {
  this.correct = 0;
  this.incorrect = 0;
  this.$el.removeClass('active');
  var circleBackground = this.$el.find('.pie-background');
  var pieSliceCover = this.$el.find('.pie-slice-cover');
  var pieSliceFill = pieSliceCover.find('.pie-slice-fill');

  circleBackground.removeAttr('style');
  pieSliceFill.removeAttr('style');
  pieSliceCover.removeAttr('style');
  this.applyRotationCss(pieSliceFill, 0);
};

ResultAnimator.prototype.resizePie = function(correct, incorrect) {
  var degreeCorrect = (correct/(correct+incorrect)) * 360;
  var degreeIncorrect = 360 - degreeCorrect;
  var circleBackground = this.$el.find('.pie-background');
  var pieSliceCover = this.$el.find('.pie-slice-cover');
  var pieSliceFill = pieSliceCover.find('.pie-slice-fill');

  this.$el.removeClass('perfect-score');
  if (incorrect === 0) {
    this.animatePie(circleBackground, pieSliceFill);
    this.$el.addClass('perfect-score');
  }
  else {
    if (degreeIncorrect <= degreeCorrect) {
      circleBackground.css('background-color','#ce3e30');
      pieSliceFill.removeAttr('style');
      pieSliceFill.css({'background-color':'#3a968a'});
      this.applyRotationCss(pieSliceFill, degreeIncorrect);
    } else {
      pieSliceFill.removeAttr('style');
      circleBackground.css('background-color','#3a968a');
      pieSliceFill.css({'background-color':'#ce3e30'});
      this.applyRotationCss(pieSliceCover, degreeIncorrect);
      this.applyRotationCss(pieSliceFill, degreeCorrect);
    }
  }
};

ResultAnimator.prototype.animatePie = function(circleBackground, pieSliceFill) {
  circleBackground.css({
    'background-color':'#3a968a',
    width:'250px',
    height:'250px',
    'margin-left': '-25px',
    'margin-top': '-25px',
    '-moz-transition': 'all 1s ease',
    '-webkit-transition': 'all 1s ease',
    '-o-transition': 'all 1s ease',
    'transition': 'all 1s ease'
  });
  pieSliceFill.removeAttr('style');
  pieSliceFill.css({'display':'none'});

  setTimeout(function(){
    circleBackground.removeAttr('style');
    circleBackground.css('background-color','#3a968a');
  }, 1000);
};

ResultAnimator.prototype.applyRotationCss = function($slice, degree) {
  $slice.css({
    '-webkit-transform':'rotate(' + degree  + 'deg)',
    '-moz-transform':'rotate(' + degree + 'deg)',
    '-o-transform':'rotate(' + degree + 'deg)',
    transform:'rotate('+ degree + 'deg)'
  });
};

ResultAnimator.prototype.render = function() {
  this.$el.html(template({
    correct: this.correct,
    incorrect: this.incorrect
  }));
};

module.exports = ResultAnimator;
