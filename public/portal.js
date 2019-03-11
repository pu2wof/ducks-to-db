$(document).ready(function() {
   $(".body.intro .b.sos").on("click",function() {
      $(".body.send").addClass("on").removeClass("off")
      $(".body.intro").removeClass("on").addClass("off")
   })
   $(".body.send .b.sos").on("click",function() {
      $(".body.sent").addClass("on").removeClass("off")
      $(".body.send").removeClass("on").addClass("off")
   })
   $(".body.send .b.details.more").on("click", function() {
      $(".head").addClass("form")
      $(".body.form").addClass("on").removeClass("off")
      $(".body.send").removeClass("on").addClass("off")
   })
   $(".body.sent .b.update").on("click", function() {
      $(".head").addClass("form")
      $(".body.form").addClass("on").removeClass("off")
      $(".body.sent").removeClass("on").addClass("off")
   })
   $(".body.form .b.sos").on("click", function() {
      $(".head").removeClass("form")
      $(".body.sent").addClass("on").removeClass("off")
      $(".body.form").removeClass("on").addClass("off")
   })
   $(".body.sent .b.home").on("click", function() {
      $(".body.intro").addClass("on").removeClass("off")
      $(".body.sent").removeClass("on").addClass("off")
   })
})