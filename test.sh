#!/usr/bin/env bash

if perl -0777 -ne 'exit 0 if /(async )?function assignClick\(.*?\) {[\s\S]+?^}$/m; exit 1' anything-not-saved.user.js; then
	echo "pattern found"
else
	echo "not found"
fi
