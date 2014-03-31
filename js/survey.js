// Main survey object
var Survey = Survey || {};

Survey = (function() {	
	return {
		// Changes the status of the submit button enabled/disabled
		// for checkboxes and radios
		changeSubmitButtonStatus: function(e)
		{
			// get element
			var element = jQuery(e);
			// Get parent form
			var parentForm = element.closest('form');
			// If there are checked elements in the entire form
			if(Survey.hasCheckedCheckboxes(parentForm) || Survey.hasCheckedRadios(parentForm))
			{
				// Enable the button
				Survey.enableButton();
			} else {
				// Otherwise disabled it
				Survey.disableButton();
			}
		},
		// Enables submit button
		enableButton: function()
		{
			if(jQuery('button[name=submitQuestion]').attr('disabled'))
				jQuery('button[name=submitQuestion]').removeAttr('disabled');
		},
		// Diable submit button
		disableButton: function()
		{
			if(!jQuery('button[name=submitQuestion]').attr('disabled'))
				jQuery('button[name=submitQuestion]').attr('disabled', 'disabled');
		},
		// Checks if the form has checked checboxes 
		hasCheckedCheckboxes: function(form)
		{
			// Get form checkbox ckildren
			var inputChild = form.children().find('input:checkbox');
			// Init return as false
			var checked = false;

			inputChild.each(function() {
				if(jQuery(this).is(':checked'))
					checked = true;
			});
			return checked;
		},
		// Same as hasCheckedCheckboxes, this time for radios
		hasCheckedRadios: function(form)
		{
			// Get form children
			var inputChild = form.children().find('input:radio');

			var checked = false;

			inputChild.each(function() {
				if(jQuery(this).is(':checked'))
					checked = true;
			});
			return checked;
		},
		// Handles the user input in rating sum
		ratingUpdate: function(input)
		{
			var input = jQuery(input);
			var val   = input.val();
			// Get parent
			var parentForm = input.closest('form');
			if(!jQuery.isNumeric(val) || val > 100)
			{
				var tempVal = val.substring(0, val.length - 1);
				input.val(tempVal);
			}

			// Get input children
			var inputChild = parentForm.children().find('input:text');
			var total = 0;

			inputChild.each(function()
			{
				if(jQuery(this).val())
				{
					total = parseInt(total) + parseInt(jQuery(this).val());
				}
			});

			var finalTotal = (100 - total);

			if(finalTotal > 100 || finalTotal < 0)
			{
				input.val('');
				input.keyup();
				Survey.disableButton();
			} else {

				jQuery('.label-total').html(finalTotal);

				if(finalTotal == 0)
				{
					Survey.enableButton();
				}
				else 
				{
					Survey.disableButton();
				}
			}

		},

		// Loads question html file
		loadFile: function(file)
		{
			var f = file;
			if(Survey.isCompleted())
			{
				f = 'end.html';
			}

			jQuery.ajax({
			  url: "/surveys/1/html/" + f,
			  cache: true
			})
			  .done(function( html ) {
			    jQuery( ".qd" ).html( html ).removeClass('csspinner');
			  });
			  return false;
		},
		// Checks is the survey was completed before
		isCompleted: function()
		{
			if(typeof jQuery.cookie('Survey') == 'undefined')
				return false;
			cookie      = jQuery.cookie('Survey');
			var obj 	= jQuery.parseJSON(cookie);
			return (obj.completed == true);
		},
		// Initialize a cookie to store the survey data
		initJsonCookie: function(data)
		{
			if(Survey.isCompleted())
			{
				Survey.loadFile('end.html');
			} else {
				var contents = (typeof data == 'undefined' ? JSON.stringify(new Object()) : JSON.stringify(data));
				jQuery.cookie("Survey", contents, {
				   expires : 1,
				   path    : '/',
				   domain  : 'smdp.local.me',
				   secure  : false
				});
			}
		},
		// Save the answer for each question to cookie
		saveAnswerData: function(el, nextFile)
		{
			var cookies 	= jQuery.cookie("Survey");
			var form        = jQuery(el);
			var qid 		= form.attr('id').replace("#form-survey-question_", "");
			var data 		= jQuery.parseJSON(cookies);
			var str     	= "Q" + qid;
			data[str] 		= jQuery(el).serialize();

			if(form.hasClass('last'))
			{
				data.completed = true;
			}

			Survey.initJsonCookie(data);

			if(nextFile !== false)
			{
				Survey.loadFile(nextFile);
			} else {
				Survey.loadFile("end.html");
				Survey.sendEmail();
			}
			
			return false;
		},
		// Open the e-mail client and send the results
		sendEmail: function()
		{
			var Subject = "Survey Results";
			var Body    = jQuery.cookie("Survey");
			var To    	= "dimmestbub@mailinator.com";
			window.open('mailto:' + To + '?subject=' + Subject + '&body=' + escape(Body));
		}
	}
})(jQuery);
jQuery(document).ready(function() {
	Survey.initJsonCookie();
});