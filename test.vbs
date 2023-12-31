set fso = createObject("Scripting.FileSystemObject")
dim buildContent : buildContent = readAsUtf8("Anything Not Saved.user.js")
set matcher = new RegExp
matcher.multiline = true
matcher.pattern = "/\*\*[\S\s]+?\*/\nfunction addCssRule\(.*\) {[\S\s]+?^}$"
set match = matcher.execute(buildContent)
msgBox match.item(0)

function readAsUtf8(filePath)
	set stream = createObject("ADODB.Stream")
	stream.type = 2
	stream.open
	stream.charset = "UTF-8"
	stream.loadFromFile filePath
	fileContent = stream.readText
	stream.close
	readAsUtf8 = fileContent
end function
