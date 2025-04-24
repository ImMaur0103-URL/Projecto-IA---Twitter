
/** 
  * This is the base controller, here we put varants, middlewares, functions
  * that the program needs in different parts. This is useful for does not repeat code.
  * Remember, put your source in module.export for it can be seen
**/

/* require area */
var express = require('express');
var passport = require('passport');
var base = require('./base');
var authKeys = require('../security/authenticationKeys');
var parseString = require('xml2js').parseString;
var sgMail = require('@sendgrid/mail');
var request = require('request');
var Spreadsheet = require('edit-google-spreadsheet');
var fs = require('fs');
var escapeJSON = require('escape-json-node');
const { Console } = require('console');

/*  const area  */
const domain = 'vivoconsulting.com';
const appName = 'Time Tracking';
const currentSprintItems = process.env.CURRENT_SPRINT_ITEMS;
const currentTasks = process.env.CURRENT_SPRINT_TASKS + '?IdUser=@IdUser';
const db = process.env.QUERY_EXECUTOR;
const originalSpringItems = process.env.CURRENT_SPRINT_ITEMS + '?IdSprint=@IdSprint&IdClients=@IdClients&IdProjects=@IdProjects&IdUsers=@IdUsers&isCurrent=@isCurrent';
const saveSprintOnDatabase = process.env.UPDATE_SPRINT_INFORMATION_AGILE + '&IdSprint=@IdSprint&Overwrite=1';
/*
 * middleware: forceAuthetication
 * redirects to login if the app does not have a session recognized
*/
var forceAuthetication = function (req, res, next) {
  if (!req.session.userId) {
    res.redirect('/');
  } else {
    next();
  }
};

var validateAuthorization = function isAuthorized(req, res, next) {
  let depuration = [];
  try {
    let httpMethod = 'GET';
    let path = (__dirname + 'rolePermission.json').replace('routes', '');
    fs.readFile(path, 'utf8', function (err, permissions) {
      permissions = JSON.parse(permissions);
      if (req.route.methods.get) {
        httpMethod = 'GET';
      }
      else if (req.route.methods.post) {
        httpMethod = 'POST'
      }
      depuration.push(httpMethod);
      depuration.push(permissions[httpMethod]);
      depuration.push(req.baseUrl + req.route.path);
      depuration.push(req.session.role);
      // if has permission
      if (!permissions[httpMethod][(req.baseUrl + req.route.path).toLowerCase()] || permissions[httpMethod][(req.baseUrl + req.route.path).toLowerCase()].roles.includes(req.session.role)) {
        next();
      } else {
        res.render('error/403');
      }
    });
  }
  catch (err) {
    console.log(depuration);
    describeError('base.js', 'isAuthorized', process.env.URL_APPSERVICE, req.session.email, depuration, err);
  }
}
/*
 * middleware: skipLogin
 * if exist a session, skip the login
*/
var skipLogin = function (req, res, next) {
  if (req.session.email) {
    res.redirect('/dashboard');
  } else {
    next();
  }
};

/*
 * function: getUser
 * Returns the user saved in session cookie
*/
function getUser(req) {
  User = {
    "user": req.session.user,
    "name": req.session.name,
    "email": req.session.email,
    "picture": req.session.picture
  }
  return User;
};

/*
 * function: restrictUsers
 * Validates if the user is valid for use the system
*/
function restrictUsers(userEmail, callback) {
  executeQuery('R', "SELECT COUNT(IdUser) [Count] FROM Users WHERE email = @Email AND Active = 1", { '@Email': userEmail }, function (count) {
    var c = count[0]['Count'];
    if (c == 0) {
      callback(false);
      return;
    }
    callback(true);
    return;
  });
}

/*
 * function: buildTables
 * Returns a string with html content of the email.
 * @jsonArray: this method wait an array of jsons with the data to deploy [{},{}]
 * @callback: function that is executed when all is finished
*/
function buildTables(jsonArray, callback) {
  var htmlResult = "<body yahoofix='true' style='min-width: 100%; margin: 0; padding: 0; font-size: 14px; font-family: arial,sans-serif; color: #000000; background-color: #eee; color: #000000;' > <center class='wrapper'><div class='webkit'><table width='100%' cellpadding='0' cellspacing='0' border='0' style='width: 100%; max-width:900px;' align='center'><tr><td style='padding: 0px 0px 0px 0px; color: #000000; text-align: left;' bgcolor='#ffffff' width='100%' align='left'><br /><br /><!-- INICIO: TITULO O ENCABEZADO DEL CORREO --><div style='float: left;position: relative;min-height: 1px;padding-right: 15px;padding-left: 15px;width: 100%;'><div style=\"position: relative;float: left;min-height: 1px;padding-right: 15px;padding-left: 15px;width: 8.33333333%;\"><a href='http://www.vivoconsulting.com/web/index.php' style=\"float:left;\"target='_blank'><img class='max-width' width='50' height='48' src='https://vivoprocurement.blob.core.windows.net/vivopropublic/logo.jpg' alt='Vivo Consulting' border='0' style='display: block; color: #000; text-decoration: none; font-family: Helvetica, arial, sans-serif; font-size: 16px;' /></a></div><div class='col-md-11'><div><br /><span style='font-size:20px;'><strong>%Title%</strong></span></div></div></div><table class='module' data-type='spacer' border='0' cellpadding='0' cellspacing='0' width='100%' style='table-layout: fixed;'><tr><td style='padding: 0px 0px 3px 0px;' bgcolor='#73c7ff'></td></tr><tr><td style='padding: 0px 0px 2px 0px;' bgcolor='#ffffff'></td></tr><tr><td style='padding: 0px 0px 3px 0px;' bgcolor='#5dbaff'></td></tr><tr><td style='padding: 0px 0px 30px 0px;' bgcolor='#ffffff'></td></tr></table><!-- FIN: TITULO O ENCABEZADO DEL CORREO --> <!-- INICIO: CUERPO DEL MENSAJE -->" +
    "<p style=\"margin-left:5%\">%bodymessage% </p><!-- FIN: CUERPO DEL MENSAJE -->" +
    "<br />" +
    "%UserList%" +
    "<br /><br /><p style=\"margin:0 5%;\"> <br /><br /></p>" +
    "<br /><br /> <div style='font-size:12px;line-height:150%;margin:0;text-align:center;'><br /> %Footer% </div></td></tr></table></div></center></body>";

  var userInfo = "";
  var userArray = jsonArray["users"];
  var itemsProcessed = 0;
  //Build information only for valid users
  getUsersForEmail(function (list) {
    if (userArray.length == 0) { callback(htmlResult.replace("%Title%", "Sprint: " + jsonArray["sprint"]["name"] + " (" + jsonArray["sprint"]["startDate"].substring(0, 10) + " - " + jsonArray["sprint"]["finishDate"].substring(0, 10) + " )").replace("%bodymessage%", "").replace("%UserList%", "").replace("%Footer%", "")); }
    userArray.forEach(function (userItem) { //find each json of data

      if (list.includes(userItem["email"].toLowerCase())) {
        buildUserInformation(userItem, function (userItem) {
          userInfo += userItem;

          //If we finished the list, then continue executing
          itemsProcessed++;
          if (itemsProcessed === userArray.length) {
            partialCallback();
          }
        });
      } else {
        itemsProcessed++;
      }
    });
  });

  function partialCallback() {
    htmlResult = htmlResult.replace("%Title%", "Sprint: " + jsonArray["sprint"]["name"] + " (" + jsonArray["sprint"]["startDate"].substring(0, 10) + " - " + jsonArray["sprint"]["finishDate"].substring(0, 10) + " )");

    getEmailMessages(function (bodyMessage, FooterMessage) {
      htmlResult = htmlResult.replace("%bodymessage%", bodyMessage);
      htmlResult = htmlResult.replace("%Footer%", FooterMessage);
      htmlResult = htmlResult.replace("%UserList%", userInfo);
      callback(htmlResult);
    });
  }
}

/*
 * function: buildUserInformation
 * Returns a string with html information of the user.
 * @user: this method method need a json with the user information
 * @callback: function that is executed when all is finished
*/
function buildUserInformation(user, callback) {
  var userTable = "<!-- INICIO: DATOS DE USUARIO -->" +
    "<a href='%IMAGEREF%' style=\"float:left; margin-left:20px;\"target='_blank'><img class='max-width' height='60' src='%IMAGEURL%' alt='Vivo Consulting' border='0' style='display: block; color: #000; text-decoration: none; font-family: Helvetica, arial, sans-serif; font-size: 16px;' /></a>" +
    "<table cellpadding='5' cellspacing='0' style=\"width:50%;margin:0 2.5%; float: left;\"><tbody><tr><td style=\"background-color:#e5eef6;border-width:thin;border:1px solid #e7e7e7;font-family: 'open sans', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif';font-size: 13px;color:#676a6c;margin:0;padding:4px 7px 2px 4px\"><b> %User%:</b></td><td></td></tr><tr><td style=\"width:60%; border-width:thin;border:1px solid #e7e7e7;font-family: 'open sans', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif';font-size: 13px;color:#676a6c;margin:0;padding:3px 20px;\">%Projects% assigned projects<br/>%Tasks% assigned tasks <br/></td><td></td></tr></tbody> </table>" +
    "<table cellpadding='5' cellspacing='0' style=\"width:30%;margin:0 10%\"><tbody><tr><td style=\"background-color:%TaskColor%;border-width:thin;border:1px solid #e7e7e7;font-family: 'open sans', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif';font-size: 13px;color:#676a6c;margin:0;padding:4px 7px 2px 4px\"><b> Assigned hours:</b></td><td></td></tr><tr><td style=\"width:60%; border-width:thin;border:1px solid #e7e7e7;font-family: 'open sans', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif';font-size: 30px;color:#676a6c;margin:0;padding:3px 20px;\">%Hours%</td><td></td></tr></tbody> </table>" +
    "<!-- FIN: DATOS DE USUARIO -->" +
    "<br />" +
    "%taskTable%" +
    "<br />" +
    "<hr>" +
    "<br />";
  userTable = userTable.replace("%User%", user["name"]);
  userTable = userTable.replace("%Projects%", user["projects"]);
  userTable = userTable.replace("%Tasks%", user["taskCount"]);
  userTable = userTable.replace("%Hours%", user["totalWork"] + "/" + user["capacity"]);
  if (user["totalWork"] > user["capacity"]) {
    userTable = userTable.replace("%TaskColor%", "#f4b8b8");
  } else if (user["totalWork"] == user["capacity"]) {
    userTable = userTable.replace("%TaskColor%", "#b8f4bb");
  } else {
    userTable = userTable.replace("%TaskColor%", "#e5eef6");
  }
  var tableTask = buildTablesForUser(user);
  userTable = userTable.replace("%taskTable%", tableTask);
  getUserImage(user, function (imageUrl) {
    userTable = userTable.replace("%IMAGEURL%", imageUrl);
    userTable = userTable.replace("%IMAGEREF%", imageUrl);
    callback(userTable);
  });

}

/*
 * function: getUserImage
 * Returns a string with the URL of the requested user
 * @user: this method method need a json with the user information
*/
function getUserImage(user, callback) {
  executeQuery('R', 'SELECT Picture from users Where IdUser = @IdUser', { "@IdUser": user["id"] }, function (result) {
    callback(result[0]["Picture"]);
  });
}

/*
 * function: getEmailMessages
 * Returns a string with the URL of the requested user
 * @user: this method method need a json with the user information
*/
function getEmailMessages(callback) {
  executeQuery('R', 'SELECT Message FROM EmailMessages ORDER BY IdEmailMessages ASC', {}, function (result) {
    callback(result[0]["Message"], result[1]["Message"]);
  });
}


/*
 * function: buildTasksTableForUser
 * Returns a string with html information for the work items of a user.
 * @user: this method method need a json with the user information
*/
function buildTasksTableForUser(workItem) {
  var tableTemplate = "<!-- INICIO: TABLA DE TAREAS -->" +
    "<div><table cellpadding='0' cellspacing='0' style=\"width:90%;margin:0 5%;border-radius:3px 4px; margin-top: 10px\"><thead><tr><td class=\"cell\" style=\"background-color:#F5F5F6;border-width:thin;border:1px solid #e7e7e7;font-weight:bold;font-family: 'open sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;font-size: 13px;color:#676a6c;margin:0;padding:3px 20px;\">Priority</td><td class=\"cell\" style=\"background-color:#F5F5F6;border-width:thin;border:1px solid #e7e7e7;font-weight:bold;font-family: 'open sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;font-size: 13px;color:#676a6c;margin:0;padding:3px 20px;\">Type</td><td class=\"cell\" style=\"background-color:#F5F5F6;border-width:thin;border:1px solid #e7e7e7;font-weight:bold;font-family: 'open sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;font-size: 13px;color:#676a6c;margin:0;padding:3px 20px;\">Title</td><td class=\"cell\" style=\"background-color:#F5F5F6;border-width:thin;border:1px solid #e7e7e7;font-weight:bold;font-family: 'open sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;font-size: 13px;color:#676a6c;margin:0;padding:3px 20px;\">State</td><td class=\"cell\" style=\"background-color:#F5F5F6;border-width:thin;border:1px solid #e7e7e7;font-weight:bold;font-family: 'open sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;font-size: 13px;color:#676a6c;margin:0;padding:3px 20px;\">Estimated duration</td></tr></thead><tbody>" +
    "%tasklist%" +
    "</tbody> " +
    "<tfoot> <tr> <td style=\"background-color:#F5F5F6;border-width:thin;border:1px solid #e7e7e7;font-weight:bold;font-family: 'open sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;font-size: 13px;color:#676a6c;margin:0;padding:3px 20px;\"/> <td style=\"background-color:#F5F5F6;border-width:thin;border:1px solid #e7e7e7;font-weight:bold;font-family: 'open sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;font-size: 13px;color:#676a6c;margin:0;padding:3px 20px;\"/> <td style=\"background-color:#F5F5F6;border-width:thin;border:1px solid #e7e7e7;font-weight:bold;font-family: 'open sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;font-size: 13px;color:#676a6c;margin:0;padding:3px 20px;\"/> <td style=\"background-color:#F5F5F6;border-width:thin;border:1px solid #e7e7e7;font-weight:bold;font-family: 'open sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;font-size: 13px;color:#676a6c;margin:0;padding:3px 20px;\">Total</td> <td style=\"background-color:#F5F5F6;border-width:thin;border:1px solid #e7e7e7;font-weight:bold;font-family: 'open sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;font-size: 13px;color:#676a6c;margin:0;padding:3px 20px;\">%total%</td> </tr> </tfoot> " +
    "</table></div><!-- FIN: TABLA DE TAREAS -->";
  var rows = buildTaskRow(workItem);

  tableTemplate = tableTemplate.replace("%total%", workItem["Effort"] + " h");
  tableTemplate = tableTemplate.replace("%tasklist%", rows);
  return tableTemplate;
}

/*
 * function: buildTablesForUser
 * Returns a string with html information for the work items of a user in many tables.
 * @user: this method method need a json with the user information
*/
function buildTablesForUser(jsonInformation) {
  var tables = "";

  var workForUser = jsonInformation["work"];
  //build the table for the user
  workForUser.forEach(function (workItem) { //find each json of data
    var tableTemplate = buildCompleteTableForUser(workItem, "");
    tables += tableTemplate;
  });

  return tables;
}

/*
 * function: buildCompleteTableForUser
 * Returns a string with html information for the work items of a user.
 * @user: this method method need a json with the user information
*/
function buildCompleteTableForUser(mainWorkItem, initialTemplate) {
  var tableTemplate = "";
  var epicTemplate = "";
  switch (mainWorkItem["WorkItemType"]) {
    case "Client":
      epicTemplate = "<p style=\"margin-left:5%; color:#00643a; font-weight: bold;\">" + mainWorkItem["WorkItemType"] + " : " + mainWorkItem["Title"] + " </p>";
      mainWorkItem.ChildItems.forEach(function (childItem) {
        tableTemplate += buildCompleteTableForUser(childItem, epicTemplate);
      });
      break;
    case "Epic":
      epicTemplate = initialTemplate + "<p style=\"margin-left:5%; color:#ff7b00; font-weight: bold;\">" + "Project" + " : " + mainWorkItem["Title"] + " </p>";
      mainWorkItem.ChildItems.forEach(function (childItem) {
        tableTemplate += (epicTemplate) + buildCompleteTableForUser(childItem);
      });
      break;
    case "Feature":
    case "User Story":
    case "Task":
    case "Bug":
      tableTemplate = buildTasksTableForUser(mainWorkItem);
      break;
    default:
      break;
  }
  return tableTemplate;
}

/*
 * function: buildTaskLine
 * Returns a string with html information of a task item, that will be used in a table
 * @user: this method method need a json with the task item information
*/
function buildTaskRow(workItem) {
  var rowTemplate = "<tr style=\"font-weight:bold\"> <td class=\"cell\" style=\"border-width:thin;border:1px solid #e7e7e7;font-family:'open sans','Helvetica Neue','Helvetica','Arial','sans-serif';font-size:13px;color:#676a6c;margin:0;padding:3px 20px\">%Count%</td> <td class=\"cell\" style=\"border-width:thin;border:1px solid #e7e7e7;font-family:'open sans','Helvetica Neue','Helvetica','Arial','sans-serif';font-size:13px;color:#676a6c;margin:0;padding:3px 20px\">%Type%</td><td class=\"cell\" style=\"border-width:thin;border:1px solid #e7e7e7;font-family:'open sans','Helvetica Neue','Helvetica','Arial','sans-serif';font-size:13px;color:#676a6c;margin:0;padding:3px 20px\">%Title%</td> <td class=\"cell\" style=\"border-width:thin;border:1px solid #e7e7e7;font-family:'open sans','Helvetica Neue','Helvetica','Arial','sans-serif';font-size:13px;color:#676a6c;margin:0;padding:3px 20px\">%State%</td> <td class=\"cell\" style=\"border-width:thin;border:1px solid #e7e7e7;font-family:'open sans','Helvetica Neue','Helvetica','Arial','sans-serif';font-size:13px;color:#676a6c;margin:0;padding:3px 20px\">%EstimatedDuration%</td> </tr>";
  rowTemplate = rowTemplate.replace("%Count%", workItem["Priority"]).replace("%Type%", workItem["WorkItemType"]);
  rowTemplate = rowTemplate.replace("%Title%", workItem["Title"]).replace("%State%", workItem["State"]);


  //Change to custom settings
  switch (workItem["WorkItemType"]) {
    case "Feature":
      rowTemplate = rowTemplate.split("676a6c").join("8a208b");
      break;
    case "User Story":
      rowTemplate = rowTemplate.split("676a6c").join("5a65e0");
      break;
    case "Task":
    case "Bug":
      rowTemplate = rowTemplate.replace("font-weight:bold", "font-weight:initial");
      break;
    default:
      break;

  }

  if (workItem["WorkItemType"] == "Task" || workItem["WorkItemType"] == "Bug") {
    rowTemplate = rowTemplate.replace("%EstimatedDuration%", workItem["Effort"] + " h");
  }
  else {
    rowTemplate = rowTemplate.replace("%EstimatedDuration%", "");
  }

  workItem.ChildItems.forEach(function (childItem) {
    rowTemplate += buildTaskRow(childItem);
  });
  return rowTemplate;
}

/*
 * function: dashboardRender
 * This method render the view inside of main content. 
 * The column with tools are load only on one view.
 * @res: the parameters is the response of request.
 * @sources: are the sources that need the main view.
 * @partialArray: the list of partial that need the views to function.
 *  Format: base.dashboardRender(res, req, { source1:element, source2:element}, {view:'dashboard/dashboard'});
 * 'view' is the name of main content, main partial.
*/
function dashboardRender(res, req, sources, partialArray) {

  try {
    sources['partials'] = partialArray; //join the entry partial
    sources['appName'] = appName;
    sources['user'] = getUser(req); //user information
    sources['partials'].settings = 'profile/settings'; //added settings modal, this only exist on the layout

    executeQuery('R', 'EXEC sp_getDefaultOptions @IdUser', { '@IdUser': req.session.userId }, function (resourcesList) { //fill the chosen on settings and build the menu
      resourcesList = resourcesList[0];
      resourcesList.MeetingProjectList = JSON.parse(resourcesList.MeetingProjectList);
      resourcesList.MeetingActivityList = JSON.parse(resourcesList.MeetingActivityList);
      resourcesList.TaskActivityList = JSON.parse(resourcesList.TaskActivityList);
      resourcesList.ProjectStageList = JSON.parse(resourcesList.ProjectStageList);
      resourcesList.Menu = JSON.parse(resourcesList.Menu);
      resourcesList.Menu.forEach(function (m, i) {
        m.hasChildren = (m.Children) ? true : false;
        if (i == resourcesList.Menu.length - 1) {
          sources['defaults'] = resourcesList;
          res.render('layout', sources);
        }
      });
    });
  } catch (err) {
    describeError('base.js', 'dashboardRender', process.env.URL_APPSERVICE, req.session.email, sources, err)
  }
}
/*
 * method: build email
 * takes of user the necessary information for build the email
 * @from: user that send the email. Example: katherine.lorenzo@vivoconsulting.com
 * @to: array with receivers of email. Example: ['katherine.lorenzo@vivoconsulting.com', 'oscar.lopez@vivoconsulting.com']
 * @subject: subject of email. Example: Recordatory
 * @content: string with html content of email. Example: <p style="font-size: 32px;">HTML Content</p>
 */
function emailSender(from_, to_, subject_, content_) {
  sgMail.setApiKey(authKeys.sendgrid.appiKey);
  const msg = {
    to: to_,//to: 'test@example.com',
    from: from_,//from: 'test@example.com',
    subject: subject_,//subject: 'Sending with SendGrid is Fun',
    text: 'Have a good day',//text: 'and easy to do anywhere, even with Node.js',
    html: content_, //html: '<strong>and easy to do anywhere, even with Node.js</strong>',
  };
  sgMail.send(msg);
}

/**
 * This function create a query and execute it with an azure function created. 
 * The azure function interacts with the database.
 * @param {*} type 
 * @param {*} query 
 * @param {*} callback
 */
function executeQuery(type, query_, dictionaryParams, callback) {
  
  request({
    url: db,
    method: "POST",
    json: true,   // <--Very important!!!
    body: { "action": type, "query": query_, "parameters": dictionaryParams }
  }, function (error, response, body) {
    //console.log(JSON.stringify({ "action": type, "query": query_, "parameters": dictionaryParams }));
    if (error) { console.log(error); }
    if (callback) { callback(body); };
  });
};


/**
 * This function refresh externals access tokens
 * @param {refresh token generates for user} refreshToken 
 * @param {client_id generates for user} client_id
 * @param {client_secret generates for user} client_secret
 */
function refreshExternalAccessToken(email, refreshToken, client_id, client_secret, callback) {
  try {
    request({
      url: 'https://www.googleapis.com/oauth2/v4/token',
      method: "POST",
      json: true,   // <--Very important!!!
      body: { "client_id": client_id, "client_secret": client_secret, "refresh_token": refreshToken, "grant_type": "refresh_token" }
    }, function (error, response, body) {
      if (error) {/* console.log(error); */ throw error; }
      if (callback) {
        callback(body, error);
      };
    });
  }
  catch (err) {
    // console.log('con la siguiente información se hizo el request');
    // console.log(refreshToken); console.log(client_id); console.log(client_secret);
    let variables = { 'refreshToken: ': refreshToken, 'ClientId: ': client_id, 'ClientSecret: ': client_secret }
    describeError('base.js', 'refreshExternalAccessToken', process.env.URL_APPSERVICE, email, variables, err);
    res.status(500);
  }
};


/**
 * This method is called to get the user Id
 * @param {Need a email} email 
 * @param {Need a callback} callback 
 */
function getUserId(email, callback) {
  executeQuery("R", "SELECT IdUser FROM Users WHERE Email = @Email", { "@Email": email }, function (body) {
    callback(body[0].IdUser);
  });
}

/**
 * This method parse the date how the database needs.
 * Input: 2017-01-06T18:30:00.000Z
 * @param {date to parse} date 
 */
function dateParser(date, withHour) {
  let d = date.split('T')[0];
  if (withHour) {
    let t = date.split('T')[1].split('.')[0];
    return d + " " + t;
  } else {
    return d;
  }
}

function getWeekNumber(d) {
  // Copy date so don't modify original
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  // Get first day of year
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculate full weeks to nearest Thursday
  var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  // Return array of year and week number
  return [d.getUTCFullYear(), weekNo];
}

function writeOnDeliveryControlSheet(Report, callback) {
  //load the spreadsheet
  Spreadsheet.load({
    debug: true,
    spreadsheetId: process.env.SHEET_DELIVERYCONTROL_SPREADSHEETID,
    worksheetName: process.env.SHEET_DELIVERYCONTROL_WORKSHEETNAME,
    oauth2: {
      client_id: process.env.SHEET_DELIVERYCONTROL_CLIENTID,
      client_secret: process.env.SHEET_DELIVERYCONTROL_SECRET,
      refresh_token: process.env.SHEET_DELIVERYCONTROL_REFRESHTOKEN
    },
  }, function sheetReady(err_, spreadsheet) {
    if (err_) throw 'Hubo un error en la parte de writeOnDeliveryControlSheet, revisar: ' + err_;
    spreadsheet.receive(function (err, rows, info) {
      if (err) throw 'Hubo un error en la parte de writeOnDeliveryControlSheet, revisar 2: ' + err;
      var curr = Object.keys(rows).length
      let failRegisters = [];
      Report.map(data => {
        curr++;
        let date = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Guatemala" }));
        let month = (date.getMonth() + 1);
        data.stringDate = date.getFullYear() + "/" + (month < 10 ? 0 + "" + month : month) + "/" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
        data.curr = curr;
        writeLineOnSheet(spreadsheet, data, function (err) {
          if (err) { curr--; failRegisters.push({ Id: data.Id, DayAbbreviation: data.DayAbbreviation, Type: data.Type }); }
        });
      });
      callback(failRegisters);
    });
  }); //close load spread sheet
}

function writeLineOnSheet(spreadsheet, data, callback) {
  try {
    spreadsheet.add(JSON.parse('{ "' + data.curr + '": { "' + 1 + '": "' + data.stringDate + '" } }'));
    spreadsheet.add(JSON.parse('{ "' + data.curr + '": { "' + 2 + '": "' + data.Email + '" } }'));
    spreadsheet.add(JSON.parse('{ "' + data.curr + '": { "' + 3 + '": "' + getDayMonthYearFormat(new Date(data.ActivityDate)) + '" } }'));
    spreadsheet.add(JSON.parse('{ "' + data.curr + '": { "' + 4 + '": "' + data.Project + '" } }'));
    spreadsheet.add(JSON.parse('{ "' + data.curr + '": { "' + 5 + '": "' + (data.Activity ? data.Activity : "") + '" } }'));
    spreadsheet.add(JSON.parse('{ "' + data.curr + '": { "' + 6 + '": "' + data.Time + '" } }'));
    spreadsheet.add(JSON.parse('{ "' + data.curr + '": { "' + 7 + '": ' + escapeJSON(JSON.stringify(data.Comment)) + ' } }'));
    //do the same for ticket 
    
    //spreadsheet.add(JSON.parse('{ "' + data.curr + '": { "' + 7 + '": "' + data.Comment + '" } }'));
    spreadsheet.add(JSON.parse('{ "' + data.curr + '": { "' + 8 + '": "' + (data.ProjectStage ? data.ProjectStage : "") + '" } }')); //Etapa	
    spreadsheet.add(JSON.parse('{ "' + data.curr + '": { "' + 9 + '": "' + Number(Number((new Date(data.ActivityDate)).getMonth()) + 1) + '" } }')); //Month
    spreadsheet.add(JSON.parse('{ "' + data.curr + '": { "' + 10 + '": "' + (new Date(data.ActivityDate)).getFullYear() + '" } }')); //Year
    spreadsheet.add(JSON.parse('{ "' + data.curr + '": { "' + 11 + '": "' + getWeekNumber(new Date(data.ActivityDate))[1] + '" } }')); //Week
    spreadsheet.add(JSON.parse('{ "' + data.curr + '": { "' + 12 + '": "" } }')); //Ocupation
    spreadsheet.add(JSON.parse('{ "' + data.curr + '": { "' + 13 + '": "Integraciones" } }')); //Asignación equipo
    spreadsheet.add(JSON.parse('{ "' + data.curr + '": { "' + 14 + '": "" } }')); //Familia	
    spreadsheet.add(JSON.parse('{ "' + data.curr + '": { "' + 15 + '": "" } }')); //Tipo Actividad	
    spreadsheet.add(JSON.parse('{ "' + data.curr + '": { "' + 16 + '": "" } }')); //reportable
    spreadsheet.add(JSON.parse('{ "' + data.curr + '": { "' + 17 + '": "" } }')); //CentroCosto
    spreadsheet.add(JSON.parse('{ "' + data.curr + '": { "' + 18 + '": "" } }')); //dias dif reporte	
    //use speadsheet!
    spreadsheet.send(function (err) {
      if (err) throw err;
      callback();
    });
  }
  catch (err) {
    console.log("ERRROR: Send to Delivery Control --->" + err);
    describeError('base.js', 'writeOnDeliveryControlSheet', process.env.URL_APPSERVICE, data.Email, data, err);
    callback(err);
  }
}

function getDayMonthYearFormat(dateToFormat) {
  let month = (Number(dateToFormat.getMonth()) + 1);
  return dateToFormat.getDate() + '/' + (month < 10 ? ('0' + month) : month) + '/' + dateToFormat.getFullYear();
}
//---> #VSTS region <---

function updateDBWorkItemsOnDemand(callback) {
  console.log('update DB workItem on demand');
  console.log('update agile...');
  request(process.env.UPDATE_SPRINT_INFORMATION_AGILE, function (error, response, body) {
    if (error) console.log(error);
    console.log();
    console.log('update vivo pro...');
    request(process.env.UPDATE_SPRINT_INFORMATION_VIVOPRO, function (error, response, body) {
      if (error) console.log(error);
      console.log('callback...');
      callback();
    });
  });
}
/**
 * Call the service with sprint information, with the filters on the view.
 * @param {Sprint filter} IdSprint 
 * @param {String with IdClients separated with comma} Clients 
 * @param {String with IdProjects separated with comma} Projects 
 * @param {Sprint with IdUsers separated with comma} Users 
 * @param {Bit if the result will be current} isCurrent 
 */
function getSprintWorkItemList(reqParams, callback) {
  ///:sprint/:clients/:projects/:resources/:isCurrent
  let query = 'SELECT VS.IdVSTSSite, VS.ProjectName ' +
    'FROM VSTSSite  VS ' +
    'WHERE VS.IdVSTSSite != @IdSite;';

  if (reqParams.isCurrent == 1) {
    var urlCurrentItems = currentSprintItems + "?IdSprint=@IdSprint&IdSite=@IdSite";
    urlCurrentItems = urlCurrentItems.replace('@IdSprint', reqParams.sprint).replace('@IdSite', reqParams.idSite);
    console.log(urlCurrentItems);
    request(urlCurrentItems, function (error, response, body) {
      if (error) console.log(error);
      let json = JSON.parse(body);
      //--- Get others sites
      executeQuery('R', query, { '@IdSite': reqParams.idSite }, function (othersSprints) {
        json['OthersSprints'] = othersSprints;
        callback(json); // get the json with sprint work items
      });
    });
  }
  //end 
  else {

    var urlWithFilters = originalSpringItems.replace("@IdSprint", reqParams.sprint).replace("@IdClients", reqParams.clients).replace("@IdProjects", reqParams.projects).replace("@IdUsers", reqParams.resources).replace("@isCurrent", reqParams.isCurrent);
    console.log(urlWithFilters);
    request(urlWithFilters, function (error, response, body) {
      if (error) console.log(error);
      let json = JSON.parse(body);
      executeQuery('R', query, { '@IdSite': reqParams.idSite }, function (othersSprints) {
        json['OthersSprints'] = othersSprints;
        callback(json); // get the json with sprint work items
      });
    });
  }
}

/**
 * This method save the sprint on the database-
 * @param {sprint to save} idSprint 
 */
function saveSprint(idSprint, email) {
  var urlWithSprint = saveSprintOnDatabase.replace('@IdSprint', idSprint);
  try {
    console.log(urlWithSprint);
    request(urlWithSprint, function (error, response, body) {
      if (error) console.log(error);
    });
  }
  catch (err) {
    describeError('base.js', 'saveSprint', process.env.URL_APPSERVICE, email, { 'request: ': urlWithSprint }, err);
    res.status(500);
  }
}
/**
 * This method get the user tasks
 * @param {user email} email 
 * @param {callback function} callback 
 */
function getTasksVSTS(IdUser, callback) {
  var url = currentTasks.replace('@IdUser', IdUser);
  console.log(url);
  request(url, function (error, response, body) {
    if (error) console.log(error);

    let json = JSON.parse(body);
    callback(json); // Print the HTML for the Google homepage.
  });
}

/*
 * function: getEmailRecipients
 * Returns a array of the users that will receive the email of the sprint
 * @callback: a function to call after its execution
*/
function getEmailRecipients(callback) {
  executeQuery('R', 'select distinct LOWER(Email) [Email] from EmailRecipients WHERE ACTIVE = 1', {}, function (n) {
    var recipients = [];
    n.forEach(function (email, index) {
      recipients.push(email["Email"]);
      if (n.length - 1 == index) {
        callback(recipients);
      }
    });
  });
}

/*
 * function: getUsersForEmail
 * Returns a array of the users that will appear in the email of the sprint
 * @callback: a function to call after its execution
*/
function getUsersForEmail(callback) {
  executeQuery('R', 'select Email from users where ShowWork = 1 AND Active = 1 ORDER BY Email ASC', {}, function (n) {
    var users = [];
    n.forEach(function (email) {
      users.push(email["Email"].toLowerCase());
    });

    callback(users);
  });
}

//---> #endregion <---


//-----------------------ERROR DEPURATION ----------------------------------
/**
 * 
 * @param {Name of js file} jsName 
 * @param {Name of method or url where ocurred the error} methodOrUrl 
 * @param {Is Localhost, Dev or Prod, need the url} environment 
 * @param {Transaction user} user 
 * @param {more relevant variables on method, it is an array} variables 
 * @param {Extra description if is necessary} moreDescription 
 */
function describeError(jsName, methodOrUrl, environment, user, variables, moreDescription) {

  if (!JSON.parse(process.env.ALERT_ERRORS)) { console.log('No se reportan Errores'); return; }
  //Error body message
  let bodyMessage =
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">'
    + '<html xmlns="http://www.w3.org/1999/xhtml">'
    + '<head>'
    + '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />'
    + '<title>Error Report TimeTracking</title>'
    + '<meta name="viewport" content="width=device-width" />'
    + '<style type="text/css">'
    + '@media only screen and (max-width: 550px),'
    + 'screen and (max-device-width: 550px) {'
    + 'body[yahoo] .buttonwrapper {'
    + 'background-color: transparent !important;'
    + '}'
    + 'body[yahoo] .button {'
    + 'padding: 0 !important;'
    + '}'
    + 'body[yahoo] .button a {'
    + 'background-color: #9b59b6;'
    + 'padding: 15px 25px !important;'
    + '}'
    + '}'
    + '@media only screen and (min-device-width: 601px) {'
    + '.content {'
    + 'width: 600px !important;'
    + '}'
    + '.col387 {'
    + 'width: 387px !important;'
    + '}'
    + '}'
    + '</style>'
    + '</head>'
    + '<body bgcolor="#583a63" style="margin: 0; padding: 0;" yahoo="fix">'
    + '<table align="center" border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 600px;"'
    + 'class="content">'
    + '<tr>'
    + '<td align="center" bgcolor="#9b59b6" style="padding: 20px 20px 20px 20px; color: #ffffff; font-family: Arial, sans-serif; font-size: 36px; font-weight: bold;">'
    + '<img src="https://vivoprocurement.blob.core.windows.net/timetrackingpublic/proui_logo.png" alt="ProUI Logo"'
    + 'width="152" height="152" style="display:block;" />'
    + 'Oops! An Error ocurred...'
    + '</td>'
    + '</tr>'
    + '<tr>'
    + '<td align="center" bgcolor="#ffffff" style="padding: 40px 20px 40px 20px; color: #555555; font-family: Arial, sans-serif; font-size: 20px; line-height: 30px; border-bottom: 1px solid #f6f6f6;">'
    + '<table width="128" align="left" border="0" cellpadding="0" cellspacing="0">'
    + '<tr>'
    + '<td height="128" style="padding: 0 20px 20px 0;">'
    + '<img src="https://vivoprocurement.blob.core.windows.net/timetrackingpublic/Eye.png" alt="Icon #3"'
    + 'width="160" height="160" style="display: block;" />'
    + '</td>'
    + '</tr>'
    + '</table>'
    + '<b>Description</b><br />'
    + '<small><strong>Environment: </strong>' + environment + '</small>'
    + '<br/>'
    + '<small><strong>Date: </strong>' + (new Date()) + '</small>'
    + '</td>'
    + '</tr>'
    + '<tr>'
    + '<td bgcolor="#ffffff" style="padding: 20px 20px 0 20px; border-bottom: 1px solid #f6f6f6;">'
    + '<table class="col387" align="left" border="0" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 387px;">'
    + '<tr>'
    + '<td>'
    + '<table width="100%" border="0" cellspacing="0" cellpadding="0">'
    + '<tr>'
    + '<td style="padding: 0 0 20px 0; color: #555555; font-family: Arial, sans-serif; font-size: 15px; line-height: 24px;">'
    + '<ul>'
    + '<li type="disc"><strong>Description: </strong></li>' + moreDescription
    + '</br>'
    + '<li type="disc"><strong> Method or Url: </strong></li>' + methodOrUrl
    + '</br>'
    + '<li type="disc"><strong>JS File: </strong></li>' + jsName
    + '</br>'
    + '<li type="disc"><strong>Transaction user: </strong></li>' + user
    + '</br>'
    + '<li type="disc"><strong>Variables: </strong></li>' + JSON.stringify(variables)
    + '</ul>'
    + '</td>'
    + '</tr>'
    + '</table>'
    + '</td>'
    + '</tr>'
    + '</table>'
    + '</td>'
    + '</tr>'
    + '<tr>'
    + '<td align="center" bgcolor="#dddddd" style="padding: 15px 10px 15px 10px; color: #555555; font-family: Arial, sans-serif; font-size: 12px; line-height: 18px;">'
    + '<b>Vivo developers</b><br /> Vivo consulting &bull; Developers Team &bull; IT Department'
    + '</td>'
    + '</tr>'
    + '</table>'
    + '</body>'
    + '</html>';

  let query = 'SELECT Email FROM devFeatures.EmailsFromBugDebuggingDevelopers ' +
    'WHERE Active = 1;';
  //send the email
  let emails = [];
  executeQuery('R', query, {}, function (arrayWithUsers) {
    arrayWithUsers.forEach(function (email, index) {
      emails.push(email.Email);
      if (index == arrayWithUsers.length - 1) {
        emailSender('no-reply@vivoconsulting.com', emails, 'Oops! An Error -TimeTracking-', bodyMessage)
      }
    });
  });
  //write the log on database
  query = 'EXEC devFeatures.sp_FillErrorLog @Environment, @MethodOrUrl, @JSFile, @Email, @Variables, @Description';

  //console.log('EXEC [devFeatures.sp_FillErrorLog] '+ environment +','+ methodOrUrl+','+ jsName+','+user+','+ JSON.stringify(variables)+','+ moreDescription);
  executeQuery('R', query, {
    '@Environment': environment, '@MethodOrUrl': methodOrUrl, '@JSFile': jsName,
    '@Email': user, '@Variables': JSON.stringify(variables), '@Description': moreDescription
  }, function () { console.log('después de ejecutar la de fill error'); });

}

/**
 * This method write rolePermission.json according the data on database.
 * It is called when a user is logging.
 */
function writePermissionsOnProject() {
  let reportVariables = [];
  try {
    let query = 'EXEC sp_getRolePermissions';
    let correctJson = {};
    executeQuery('R', query, {}, function (Permission) {
      reportVariables.push(Permission);
      Permission.forEach(function (p, indexPermission) {
        p = JSON.parse(p.Value)[0];
        correctJson[p.CurrentMethod] = {};
        p.Path.forEach(function (currentPath, indexPath) {
          //paths
          correctJson[p.CurrentMethod][currentPath.Path.toLowerCase()] = { 'roles': currentPath.Role.map(a => a.Role) };
          if (indexPath == p.Path.length - 1 && indexPermission == Permission.length - 1) {
            //write file
            fs.writeFile('rolePermission.json', JSON.stringify(correctJson), (err) => {
              if (err) throw err;
              // success case, the file was saved
              console.log('Permission saved!');
            });
          }
        })
      });
    });
  }
  catch (err) {
    describeError('base.js', 'writePermissionsOnProject', process.env.URL_APPSERVICE, req.sessiom.email, reportVariables, err);
  }
}

/*  sources exported   */
module.exports = {
  //general
  forceAuthetication,
  validateAuthorization,
  getUser,
  skipLogin,
  domain,
  appName,
  buildTables,
  restrictUsers,
  dashboardRender,
  executeQuery,
  getUserId,
  refreshExternalAccessToken,
  //vsts
  getTasksVSTS,
  getSprintWorkItemList,
  saveSprint,
  updateDBWorkItemsOnDemand,
  //more features
  emailSender,
  dateParser,
  getEmailRecipients,
  //Delivery
  writeOnDeliveryControlSheet,

  //Dev features
  describeError,

  //About roles
  writePermissionsOnProject,
}