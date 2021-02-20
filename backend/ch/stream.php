<?php
$name_key = "name";
$offset_key = "offset";
$limit_key = "limit";

if (array_key_exists($name_key, $_GET)) {
	$file_contents = file_get_contents("store/{$_GET[$name_key]}.json");

	if ($file_contents) {
		if (array_key_exists($offset_key, $_GET) || array_key_exists($limit_key, $_GET)) {
			$offset = $_GET[$offset_key];
			$limit = $_GET[$limit_key];

			if (($offset > -1) && ($limit > -1)) {
				$file_json = json_decode($file_contents);

				if (is_array($file_json)) {
					echo(json_encode(array_slice($file_json, $offset, $limit)));

					return;
				}
			}
		} else {
			echo($file_contents);

			return;
		}
	}
}

echo("[]");
?>
