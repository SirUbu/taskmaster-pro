var tasks = {};

var createTask = function(taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>").addClass("badge badge-primary badge-pill").text(taskDate);
  var taskP = $("<p>").addClass("m-1").text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  // check due date
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function() {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function(list, arr) {
    // then loop over sub-array
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

var auditTask = function(taskEl) {
  // get date from task element
  var date = $(taskEl).find("span").text().trim();

  // convert date to moment object
  var time = moment(date, "L").set("hour", 17);

  // remove any previously applied class styling
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

  // apply new class styling if near/over due
  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
  } else if (Math.abs(moment().diff(time, "days")) < 2) {
    $(taskEl).addClass("list-group-item-warning");
  }
};

// user clicks on task description to change
$(".list-group").on("click", "p", function() {
  var text = $(this).text().trim();
  var textInput = $("<textarea>").addClass("form-control").val(text);
  $(this).replaceWith(textInput);
  textInput.trigger("focus");
});

// user clicks out of task description to save change
$(".list-group").on("blur", "textarea", function() {
  // get the textarea current value/text
  var text = $(this).val().trim();

  // get the parent ul id attribute
  var status = $(this).closest(".list-group").attr("id").replace("list-", "");

  // get the task position in the list of other li elements
  var index = $(this).closest(".list-group-item").index();

  tasks[status][index].text = text;
  saveTasks();

  // recreate p element
  var taskP = $("<p>").addClass("m-1").text(text);

  // replace textarea with p element
  $(this).replaceWith(taskP);
});

// user clicks on date to change
$(".list-group").on("click", "span", function() {
  // get current text
  var date = $(this).text().trim();
  
  // create new input element
  var dateInput = $("<input>").attr("type", "text").addClass("form-control").val(date);

  // swap out element
  $(this).replaceWith(dateInput);

  // enable datepicker
  dateInput.datepicker({
    minDate: 0,
    onClose: function() {
      // when calendar is closed, force a "change" event on the "dateInput"
      $(this).trigger("change");
    }
  });

  // automatically focus on new element
  dateInput.trigger("focus");
});

// user clicks away from date to save change
$(".list-group").on("change", "input[type='text']", function() {
  // get current text
  var date = $(this).val().trim();

  // get the parent ul id attribute
  var status = $(this).closest(".list-group").attr("id").replace("list-", "");

  // get the task position in the list of other li elements
  var index = $(this).closest(".list-group-item").index();

  // update the task in array and re-save to localStorage
  tasks[status][index].date = date;
  saveTasks();

  // recreate span element
  var taskSpan = $("<span>").addClass("badge badge-primary badge-pill").text(date);

  // replace input with span element
  $(this).replaceWith(taskSpan);

  // pass task's <li> element into auditTask() to check new date
  auditTask($(taskSpan).closest(".list-group-item"));
});

// drag and drop logic
$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function(event) {
    $(this).addClass("dropover");
    $(".bottom-trash").addClass("bottom-trash-drag");
  }, 
  deactivate: function(event) {
    $(this).removeClass("dropover");
    $(".bottom-trash").removeClass("bottom-trash-drag");
  },
  over: function(event) {
    $(event.target).addClass("dropover-active");
  },
  out: function(event) {
    $(event.target).removeClass("dropover-active");
  },
  update: function(event) {
    // array to store the task data in
    var tempArr = [];

    // loop over current set of children in sortable list
    $(this).children().each(function() {
      var text = $(this).find('p').text().trim();
      var date = $(this).find('span').text().trim();

      // add task data to the temp array as an object
      tempArr.push({
        text: text,
        date: date
      });
    });

    // trim down list's ID to match object property
    var arrName = $(this).attr("id").replace("list-", "");

    // update array on tasks object and save
    tasks[arrName] = tempArr;
    saveTasks();
  }
});

// trash drop delete logic
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function(event, ui) {
    ui.draggable.remove();
    $(".bottom-trash").removeClass("bottom-trash-active");
  },
  over: function(event, ui) {
    $(".bottom-trash").addClass("bottom-trash-active");
  },
  out: function(event, ui) {
    $(".bottom-trash").removeClass("bottom-trash-active");
  }
});

// datepicker logic
$("#modalDueDate").datepicker({
  minDate: 0
});

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(function() {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

// remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// interval timer to periodically check task due date
setInterval(function() {
  $(".card .list-group-item").each(function(index, el) {
    auditTask(el);
  });
}, (1000 * 60) * 30);

// load tasks for the first time
loadTasks();