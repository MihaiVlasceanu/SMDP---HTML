// Main survey object
var Survey = Survey || {};

Survey = (function() {	
	return {
		COOKIE_NAME				: 'Survey',
		DEFAULT_Q1				: 'q1.html',
		DEFAULT_ENDF			: 'end.html',
		DEFAULT_MAIL_SBJ		: 'Survey Answers',
		DEFAULT_MAIL_TO 		: 'dimmestbub@mailinator.com',
		DEFAULT_SPINNER 		: 'csspinner',
		SURVEY_FORM_CONTAINER	: '.qd',
		CONSTSUM_VAL_LBL_CLS    : '.label-total',
		SURVEY_NXTQS_BTN_SEL    : 'button[name=submitQuestion]',
		SURVEY_FORK_SEL 		: 'data-next',
		// Changes the status of the submit button enabled/disabled
		// for checkboxes and radios
		changeSubmitButtonStatus: function(e)
		{
			// get element
			var element = jQuery(e);
			// Get parent form
			var parentForm = element.closest('form');
			// update chb
			Survey.emptyOther(element, parentForm);
			// If there are checked elements in the entire form
			if(Survey.hasCheckedCheckboxes(parentForm) || Survey.hasCheckedRadios(parentForm) || !Survey.isRequired(parentForm))
			{
				// Enable the button
				Survey.enableButton();
			} else {
				if(Survey.isRequired)
				{
					// Otherwise disabled it
					Survey.disableButton();
				}
			}
		},
		// Enables submit button
		enableButton: function()
		{
			if(jQuery(Survey.SURVEY_NXTQS_BTN_SEL).attr('disabled'))
				jQuery(Survey.SURVEY_NXTQS_BTN_SEL).removeAttr('disabled');
		},
		// Diable submit button
		disableButton: function()
		{
			if(!jQuery(Survey.SURVEY_NXTQS_BTN_SEL).attr('disabled'))
				jQuery(Survey.SURVEY_NXTQS_BTN_SEL).attr('disabled', 'disabled');
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
		constantSumUpdate: function(input)
		{
			// Convert current input to Object
			var input = jQuery(input);
			// Get the value typed by the user
			var val   = input.val();
			// Get parent form
			var parentForm = input.closest('form');
			// Get the maximum value of the sum
			var ttlVal = (typeof jQuery(parentForm).attr('data-href') !== 'undefined' ? parseInt(jQuery(parentForm).attr('data-href'), 10) : 100);
			// If the user eneters an invalid value to the field
			if(!jQuery.isNumeric(val) || val > ttlVal)
			{
				// Delete the last typed character
				input.val(val.substring(0, val.length - 1));
			}
			// Find all the form inputs
			var inputChild = parentForm.children().find('input[type=number]');
			// init a counter
			var total = 0;
			// All the fields have been filled (default)
			var allRated = true;

			inputChild.each(function()
			{
				// If the current input in the loop has a value set
				if(jQuery(this).val())
				{
					// Increase the counter with its' value
					total = parseInt(total) + parseInt(jQuery(this).val());
				} else {
					// Otherwise mark as not filled in
					allRated = false;
				}
			});
			// compare the overall target of the form with the counter
			var finalTotal = (ttlVal - total);
			// If they don't have the same value
			if(finalTotal > ttlVal || finalTotal < 0 && Survey.isRequired(parentForm))
			{
				// Keep the submit button disabled
				Survey.disableButton();
			} else {
				// Update the visible counter
				jQuery(Survey.CONSTSUM_VAL_LBL_CLS).html(finalTotal);
				// If the total of the values of all the fields matches
				// the overall target
				if(finalTotal == 0)
				{
					// If all the fields have been filled in
					if(allRated)
					{
						// Enable the submit button
						Survey.enableButton();
					}
				// Otherwise, disable the button
				} else {
					if(Survey.isRequired(parentForm))
					{
					 	Survey.disableButton();
					}
				}
			}
		},
		// Handle staple and ratings
		ratingUpdate: function(input)
		{
			// Convert current input to Object
			var input = jQuery(input);
			// Get parent form
			var parentForm = input.closest('form');
			// Get the value of the radio checked by the user
			var thisRatingValue = input.val();
			// Check how many items to rate are present into the table
			var itemsNo = jQuery('td.item').length;
			// Init all checked to true by default
			var allrated = true;
			// selected
			var seletedItemsNo = 0;
			// Loop through each item to rate
			jQuery('td.item').each(function() {
				// Convert item to jQUery object
				var td = jQuery(this);
				// Get the parent row
				var tr = td.parent();
				// Search for a checked radio in this field
				var checked = tr.children().find("input:radio").filter(':checked');
				// If there is exactly one checked field, increase the counter
				if(checked.length == 1)
					seletedItemsNo++;
			});

			// Enable the submit button if all the items were rated
			if(seletedItemsNo == itemsNo) {
				Survey.enableButton();
			} else {
				if(Survey.isRequired(parentForm)) {
					Survey.disableButton();
				}
			}
		},
		// Loads question html file
		loadFile: function(file)
		{
			// Show a loader
			if(!jQuery(Survey.SURVEY_FORM_CONTAINER).hasClass(Survey.DEFAULT_SPINNER))
			{
				jQuery(Survey.SURVEY_FORM_CONTAINER).addClass(Survey.DEFAULT_SPINNER);
			}

			var f = file;
			if(Survey.isCompleted())
			{
				f = Survey.DEFAULT_ENDF;
			}

			jQuery.ajax({
			  url: "surveys/1/html/" + f,
			  cache: true
			})
			  .done(function( html ) {
			    jQuery(Survey.SURVEY_FORM_CONTAINER).html( html ).removeClass('csspinner');
			  });
			  return false;
		},
		// Checks if a certain question is required
		isRequired: function(form)
		{
			return form.hasClass('required');
		},
		// Checks is the survey was completed before
		isCompleted: function()
		{
			if(typeof Survey.getCookie() == 'undefined')
				return false;
			return (Survey.getCookie().completed == true);
		},
		// Initialize a cookie to store the survey data
		initJsonCookie: function(data)
		{	
			// Cookie data
			var contents = (typeof data == 'undefined' ? JSON.stringify(new Object()) : JSON.stringify(data));
			// Create the cookie
			jQuery.cookie(Survey.COOKIE_NAME, contents, {
				// Expires after 1 day
			   	expires : 1,
			   	// path for the Cookie
			   	path    : '/',
			   	// Cookie domain (important)
			   	domain  : window.location.host,
			   	// true if using HTTPS
			   	secure  : false
			});
		},
		// Save the answer for each question to cookie
		saveAnswerData: function(form, nextId)
		{
			// Try to parse the nextId to int if it is not false
			if(!jQuery.isNumeric(nextId) && nextId !== false)
				nextId = parseInt(nextId);

			// Get curent cookies
			var cookies 				= Survey.getCookie();
			// Get form for which data is being saved
			var formObject      		= jQuery(form);
			// Get the ID of the question from the form's ID
			var questionId 				= formObject.attr('id').replace("form-survey-question_", "");
			// Init nextfile var
			var nextFile;
			// Check if there are no cookies
			if(typeof cookies.questionNode == 'undefined')
			{
				// Init the new data object node
				cookies.questionNode   		= [];
			}
				
			// Question Object
			var question 				= {};
			// Set an id
			question.id 				= questionId;
			// Save the answers
			question.answers			= formObject.serialize();
			// If there are forks
			if(Survey.getFork(formObject) !== false)
			{
				// Get the appropriate fork file
				nextFile = Survey.getQuestionFileName(Survey.getFork(formObject));
				// And the ID
				nextId   = Survey.getFork(formObject);
			} else {
				if(nextId !== false)
				{
					nextFile = Survey.getQuestionFileName(nextId);
				} else {
					nextFile = false;
				}
			}

			if(nextFile !== false && typeof nextFile !== 'undefined')
			{
				// Save the next file
				question.nextFile 			= nextFile;
				// Save next question id
				question.nextId 			= nextId;
			} 
			
			// Set as answered question
			question.answered  			= true;
			// Add to cookie
			cookies.questionNode.push(question);
			// If this was the last question
			if(formObject.hasClass('last'))
			{
				// Set the Survey as completed (cookie)
				cookies.completed = true;
			}
			// Save the actual cookie
			Survey.initJsonCookie(cookies);
			// If the next file is set
			if(!Survey.isCompleted())
			{
				// Load that file
				Survey.loadFile(nextFile);
			} else {
				// Otherwise go to the finish
				Survey.loadFile(Survey.DEFAULT_ENDF);
				// And send e-mail
				Survey.sendEmail();
			}
			return false;
		},
		initSurvey: function()
		{
			// If the survey was already completed
			if(Survey.isCompleted())
			{
				// Load the finish file
				Survey.loadFile(Survey.DEFAULT_ENDF);
				// and get out
				return false;
			}

			// Default question file to load
			var fileToLoad = Survey.DEFAULT_Q1;			
			// Load the file
			Survey.loadFile(fileToLoad);
		},
		// Validate textarea inputs
		validateTextarea: function(area)
		{
			if(typeof area == 'undefined' || area == false)
				return false;
			// Convert to jQUery
			var area = jQuery(area);
			// Get the value
			var value = area.val().trim();
			// If the text size is bigger than 3, enable the next button
			if(value.length > 3) {
				Survey.enableButton();
			} else {
				if(Survey.isRequired(jQuery(area.closest('form')))) {
					Survey.disableButton();
				}
			}
		},
		// Open the e-mail client and send the results
		sendEmail: function()
		{
			var Subject = Survey.DEFAULT_MAIL_SBJ;
			var Body    = Survey.getCookie();
			var To    	= Survey.DEFAULT_MAIL_TO;
			// Open Email client
			var mail 	= window.open('mailto:' + To + '?subject=' + Subject + '&body=' + Survey.format());
			// Close the new browser tab
			mail.close();
		},

		questionIsAnswered: function(id)
		{
			if(typeof id == 'undefined' || id == false || !jQuery.isNumeric(id))
				return false;

			var answered = false;

			for(var i in Survey.getCookie().questionNode)
			{
				if(Survey.getCookie().questionNode[i].id == id && Survey.getCookie().questionNode[i].answered)
					answered = true;
			}

			return answered;
		},

		getFirstUnAnswQueAfter: function(id)
		{
			if(!jQuery.isNumeric(id))
			{
				return false;
			}
			else
				var qid = id;

			if(Survey.questionIsAnswered(qid))
				return Survey.getFirstUnAnswQueAfter(qid);
			else
				return qid;
		},
		getFork: function(form)
		{
			var toReturn = false;
			var search = ['input:text', 'input:radio', 'input:checkbox', 'input[type=number]'];
			for (var i = 0; i < search.length; i++) {
				var currentType = search[i];
				var elements 	= form.find(currentType);
				elements.each(function()
				{
					if(jQuery(this).attr(Survey.SURVEY_FORK_SEL) !== 'undefined') {
						
						if(currentType == 'input:text' || currentType == 'input[type=number]')
						{
							if(jQuery(this).val().trim() !== '')
								toReturn = jQuery(this).attr(Survey.SURVEY_FORK_SEL);
						}

						if(currentType == 'input:radio' || currentType == 'input:checkbox')
						{
							if(jQuery(this).is(':checked'))
								toReturn = jQuery(this).attr(Survey.SURVEY_FORK_SEL);
						}
					}
				});
			}
			if(typeof toReturn == 'undefined')
				toReturn = false;
			return toReturn;
		},
		getQuestionFileName: function(id)
		{
			return "q" + id + ".html";
		},
		// Formats the e0mail body
		format: function()
		{
			var body = "";

			if(!Survey.isEmpty())
			{
				for(var i in Survey.getCookie().questionNode)
				{
					var qs = Survey.getCookie().questionNode[i];
					var newLine =  escape("\n\r");
					body += "Q" + qs.id + ": " + escape(qs.answers) + newLine;
				}
			}
			return body;
		},
		// Checkes the rative checbox for the other field
		updateOther: function(input)
		{
			// Get the input
			var txt = jQuery(input);
			// Get the related checbox/radio
			if(txt.attr('data-for'))
			{
				var dataFor = txt.attr('data-for');
				// Convert it ti jQuery
				var box 	= jQuery(dataFor);
				// If it is not already checked
				if(!box.is(':checked'))
				{
					// trigger a click on it
					box.trigger('click');
				}
			}
		},
		// Resets the survey
		reset: function()
		{
			// Reset cookies
			Survey.initJsonCookie();
			// Load the 1st question file
			Survey.loadFile(Survey.DEFAULT_Q1);
		},
		// Checks if the cookie is empty
		isEmpty: function()
		{
		  var isEmpty = true;
		  for(keys in Survey.getCookie())
		  {
		     isEmpty = false;
		     break; // exiting since we found that the object is not empty
		  }
		  return isEmpty;
		},
		emptyOther: function(element, form)
		{
			// Get form children
			var txt = jQuery(form.children().find('input:text.other')[0]);
			// element
			if(!element.is(':checked'))
			{
				txt.val('');
			}
		},
		// A getter for the cookie
		getCookie: function()
		{
			if(jQuery.cookie && jQuery.cookie(Survey.COOKIE_NAME))
			{
				return jQuery.parseJSON(jQuery.cookie(Survey.COOKIE_NAME));
			} else {
				Survey.initJsonCookie();
			}
		}
	}
})(jQuery);