// Main survey object
var Survey = Survey || {};

Survey = (function() {	
	return {
		COOKIE_NAME		: 'Survey',
		DEFAULT_Q1		: 'q1.html',
		DEFAULT_ENDF	: 'end.html',
		DEFAULT_MAIL_SBJ: 'Survey Answers',
		DEFAULT_MAIL_TO : 'dimmestbub@mailinator.com',
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
			var allRated = true;
			inputChild.each(function()
			{
				if(jQuery(this).val())
				{
					total = parseInt(total) + parseInt(jQuery(this).val());
				} else {
					allRated = false;
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
					if(allRated)
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
				f = Survey.DEFAULT_ENDF;
			}

			jQuery.ajax({
			  url: "surveys/1/html/" + f,
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

			console.log(jQuery.cookie(Survey.COOKIE_NAME));
		},
		// Save the answer for each question to cookie
		saveAnswerData: function(form, nextFile)
		{
			// Get curent cookies
			var cookies 				= Survey.getCookie();
			// Get form for which data is being saved
			var formObject      		= jQuery(form);
			// Get the ID of the question from the form's ID
			var questionId 				= formObject.attr('id').replace("form-survey-question_", "");
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

			if(nextFile !== false && typeof nextFile !== 'undefined')
			{
				// Save the next file
				question.nextFile 			= nextFile;
				// Save next question id
				question.nextId 			= parseInt(nextFile.replace('q', '').replace('.html', ''));
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

			// TO DO (Maybe?)
			// Look for unanswered questions
			/*if(!jQuery.isEmptyObject(Survey.getCookie()))
			{
				var size = Survey.getCookie().questionNode.length;
				console.log(size);
				for(var i in Survey.getCookie().questionNode)
				{	
					console.log(Survey.getCookie().questionNode[i]);
					if(Survey.getCookie().questionNode[i].answered)
					{
						var next = Survey.getFirstUnAnswQueAfter(Survey.getCookie().questionNode[i].id);
						if(next)
						{
							//fileToLoad = 'q' + ( + '.html';
							console.log("Iem: " + Survey.getCookie().questionNode[i]);
						}
						
					}
				}
			}*/
			

			// Load the file
			Survey.loadFile(fileToLoad);
		},
		// Open the e-mail client and send the results
		sendEmail: function()
		{
			var Subject = Survey.DEFAULT_MAIL_SBJ;
			var Body    = Survey.getCookie();
			var To    	= Survey.DEFAULT_MAIL_TO;
			window.open('mailto:' + To + '?subject=' + Subject + '&body=' + Survey.format());
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

			console.log(qid);
			if(Survey.questionIsAnswered(qid))
				return Survey.getFirstUnAnswQueAfter(qid);
			else
				return qid;
		},

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
		reset: function()
		{
			Survey.initJsonCookie();
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