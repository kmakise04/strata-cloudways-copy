(function() {
  // Helper to get URL parameters
  function getParameterByName(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  let offset = 0;
  const limit = 50;

  // Get userId from the URL parameters
  const userParam = getParameterByName("user");

  // Check if userParam exists
  let userId = null;
  if (userParam) {
    userId = userParam; // No need to split, since we expect "user=1"
  } else {
    console.error("No user parameter found in the URL");
  }

  // Execute after the DOM is fully loaded
  $(document).ready(function () {
    console.log(userId, "userId");

    // Get unit details from the URL
    const viewParam = getParameterByName("view");
    let unitId = null, unitAddress = null, unitName = "Unknown Unit";

    if (viewParam) {
      const urlParams = viewParam.split('/');
      unitId = urlParams[0];
      unitAddress = decodeURIComponent(urlParams[1] || "Unknown Address");
      unitName = urlParams[2] || "Unknown Unit";
    } else {
      console.error("No view parameter found in the URL");
    }

    // Make sure unitName and unitAddress are defined before using them
    $('#unit-display').text(unitName);
    $('#address-display').text(unitAddress);
    $('#unit-display2').text(unitName);
    $('#address-display2').text(unitAddress);

    // Show or hide the "Go to Top" button based on main content scroll position
    $('main').scroll(function () {
      if ($(this).scrollTop() > 100) {
        $('#goTopBtn').fadeIn();
      } else {
        $('#goTopBtn').fadeOut();
      }
    });

    // Scroll to top of the main content when button is clicked
    $('#goTopBtn').click(function () {
      $('main').animate({ scrollTop: 0 }, 200); // Target main container scroll
      return false;
    });

    // Function to fetch resources for a question
    function fetchResource(resourceId, questionId) {
      $.ajax({
        url: "/api/reportpageresource.php",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({ resourceId: resourceId }),
        success: function (response) {
          if (response.success && response.resources.length > 0) {
            response.resources.forEach((resource) => {
              populateSource(questionId, resource);
            });
          } else {
            console.log("Error fetching resource for question ID " + questionId);
            $(`#${questionId}Source`).text("No sources found");
          }
        },
        error: function (xhr, status, error) {
          console.error("An error occurred while fetching resource: " + error);
        },
      });
    }

    // Function to populate resource sources
    function populateSource(questionId, resource) {
      const id = resource.id;
      const filename = resource.filename;
      const page = resource.page;
      let contextContent = resource.context_chunks
        ? resource.context_chunks.join(' ')
        : resource.context;

      validateUserIdAndUnitId();
    }

    // Validate the presence of userId and unitId
    function validateUserIdAndUnitId() {
      if (!userId || !unitId) {
        console.error('userId or unitId is not defined');
        return;
      }
    }

    // Fetch questions if unitId exists
    if (unitId) {
      fetchQuestions(unitId, offset, limit);
    } else {
      $("#results").html('<div class="alert alert-warning">No unit ID specified in URL.</div>');
    }

    // Fetch questions from the server
    function fetchQuestions(unitId, offset, limit) {
      $.ajax({
        url: "/api/reportpagequestions.php",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({ unitId: unitId, limit: limit, offset: offset }),
        success: function (response) {
          if (response.success) {
            populateAnswers(response.questions);
            if (response.questions.length === limit) {
              offset += limit;
              fetchQuestions(unitId, offset, limit);
            }
          } else {
            $("#results").html('<div class="alert alert-danger">Error: ' + response.error + "</div>");
          }
        },
        error: function (xhr, status, error) {
          $("#results").html('<div class="alert alert-danger">An error occurred: ' + error + "</div>");
        },
      });
    }

    // Populate answers
    function populateAnswers(questions) {
      questions.forEach((question) => {
        const questionId = question.questionId;
        let answerContent = "";

        if (question.answer_chunks) {
          question.answer_chunks.forEach((chunk) => {
            answerContent += chunk;
          });
        } else {
          answerContent = question.answer;
        }

        $(`#${questionId}Answer`).html(marked.parse(answerContent));
        $(`#${questionId}Answer2`).html(marked.parse(answerContent));

        const resourceId = question.resourceId;
        fetchResource(resourceId, questionId);

        if (questionId === 'StrataPlanNumber2') {
          $(`#StrataPlanNumber2Answer`).text('');
        }
      });
    }

    var $mainContent = $('#main-content');

    // Initialize ScrollSpy
    const scrollSpyTopnav = new bootstrap.ScrollSpy($mainContent[0], {
      target: '#topnav',
      rootMargin: '0px 0px -40%'
    });

    const scrollSpySidebar = new bootstrap.ScrollSpy($mainContent[0], {
      target: '#sidebarnav',
      rootMargin: '0px 0px -40%'
    });

    $(window).on('resize', function () {
      scrollSpyTopnav.refresh();
      scrollSpySidebar.refresh();
    });

    // Handle PDF download
    document.querySelectorAll('.download-btn').forEach(button => {
      button.addEventListener('click', function () {
        const unitNo = document.getElementById('unit-display').innerText || 'Unit';
        const unitAddress = document.getElementById('address-display').innerText || 'Address';
        const strataPlanNumber = document.getElementById('StrataPlanNumberAnswer').innerText || 'Strata Plan Number';

        const element = document.getElementById('report-sections-content');

        html2pdf()
          .from(element)
          .set({
            margin: [0.5, 0.5, 0.5, 0.5],
            filename: `${strataPlanNumber} - ${unitNo} ${unitAddress}.pdf`,
            html2canvas: { scale: 1 },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
          })
          .save();
      });
    });

    // Initialize tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
  });
})();
