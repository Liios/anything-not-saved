const adTypeBinary = 1
const adTypeText = 2
const adSaveCreateOverWrite = 2
const buildPath = "Anything Not Saved.user.js"
dim buildContent : buildContent = readAsUtf8(buildPath)
set fso = createObject("Scripting.FileSystemObject")
set parts = fso.getFolder("./parts")
dim lost : lost = ""
for each part in parts.files
	dim partContent : partContent = readAsUtf8(part.path)
	set funcMatcher = new RegExp
	funcMatcher.multiLine = true
	funcMatcher.pattern = "function " + fso.getBaseName(part) + "\(.*\) {[\S\s]+?^}$\r\n"
	if funcMatcher.execute(buildContent).count = 0 then
		lost = lost + fso.getBaseName(part) + " not found" + vbNewLine
	end if
	buildContent = funcMatcher.replace(buildContent, partContent)
next
writeAsUtf8 buildPath, buildContent
if len(lost) > 0 then
	msgBox lost
else
	msgBox "Done"
end if

function readAsUtf8(filePath)
	set stream = createObject("ADODB.Stream")
	stream.type = adTypeText
	stream.open
	stream.charset = "UTF-8"
	stream.loadFromFile filePath
	fileContent = stream.readText
	stream.close
	readAsUtf8 = fileContent
end function

sub writeAsUtf8(filePath, content)
	set textStream = createObject("ADODB.Stream")
	textStream.type = adTypeText
	textStream.open
	textStream.charset = "UTF-8"
	textStream.writeText content
	textStream.position = 3 'skip BOM characters
	set binStream = createObject("ADODB.Stream")
	binStream.type = adTypeBinary
	binStream.open
	textStream.copyTo binStream
	textStream.close
	binStream.saveToFile filePath, adSaveCreateOverWrite
	binStream.close
end sub
