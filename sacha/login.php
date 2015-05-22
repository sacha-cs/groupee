#!/usr/bin/php
<?php

require('lib/password.php');

if(isset($_POST['submit'])) {
	LogIn();
}

function LogIn() {

	$dbconn = pg_connect("host=db.doc.ic.ac.uk dbname=g1427136_u user=g1427136_u password=5tTcpsouh0");
	if (!$dbconn) {
  		echo "An error has occurred.\n";
  		exit;
	}

	if(!empty($_POST['username']) AND !empty($_POST['password'])) {

		$query = pg_query($dbconn, "SELECT pwdhash FROM users WHERE username='".strtolower($_POST[username])."'");
		$row = pg_fetch_row($query);

		if ($row) {
			$password_hashed = pg_fetch_result($query, 0, 0);
			if(password_verify($_POST[password], $password_hashed)) {
				echo "Welcome Back!";
			} 
			else {
				echo "Username and Password combination wrong";
			}
		} 
		else {
			echo "Username does not exist";
		}
	} 
	else {
		echo "Please fill in username and password";
	}
}


?>