#!/usr/bin/php
<?php

require('lib/password.php');

if(isset($_POST['submit'])) {
	Register();
}

function Register() {

	$dbconn = pg_connect("host=db.doc.ic.ac.uk dbname=g1427136_u user=g1427136_u password=5tTcpsouh0");
	if (!$dbconn) {
  		echo "An error occurred."."<br>";
  		exit;
	}

	if(!empty($_POST['username']) AND !empty($_POST['password']) AND !empty($_POST['passwordconfirm'])) {
		$query = pg_query($dbconn, "SELECT * FROM users WHERE username='".strtolower($_POST[username])."'");
		if (pg_num_rows($query) > 0) {
			echo "Username ". $_POST['username']." is already taken"."<br>";
			echo "<a href=\"register.html\">Try again</a>";
			exit;
		}

		if ($_POST['password'] == $_POST['passwordconfirm']) 
		{
			$query = pg_query($dbconn, "INSERT INTO users(username, password, pwdhash) VALUES('".strtolower($_POST[username])."','$_POST[password]', '".password_hash($_POST[password], PASSWORD_DEFAULT)."')");
			$query = pg_query($dbconn, "SELECT * FROM users WHERE username='".strtolower($_POST[username])."' AND password='$_POST[password]'");
			$row = pg_fetch_row($query);
		}
		
		if($row) {
			echo "You've registered successfully!"."<br>";
			echo "<a href=\"index.html\">Click here to Log In</a>";

		} 

		else {
			echo "Something went wrong...<br>";
			echo "<a href=\"register.html\">Try again</a>";
		}
	} 

	else {
		echo "Please complete all fields"."<br>";
		echo "<a href=\"register.html\">Try again</a>"; 
	}
}


?>
