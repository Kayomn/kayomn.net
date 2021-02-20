<?php
$stream_key = "stream";
$name_key = "name";

if (array_key_exists($stream_key, $_GET) && array_key_exists($name_key, $_GET)) {
	$file_contents = file_get_contents("store/{$_GET[$stream_key]}/{$_GET[$name_key]}.json");

	if ($file_contents) {
		echo($file_contents);

		return;
	}
}

echo("[]");
?>
