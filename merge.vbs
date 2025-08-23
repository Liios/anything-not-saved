const adTypeBinary = 1
const adTypeText = 2
const adSaveCreateOverWrite = 2
const adReadLine = -2
const buildPath = "anything-not-saved.user.js"
const metaPath = "anything-not-saved.meta.js"
dim buildContent : buildContent = readAsUtf8(buildPath)
set fso = createObject("Scripting.FileSystemObject")
set parts = fso.getFolder("./parts")
dim lost : lost = ""
for each part in parts.files
	dim partContent : partContent = readAsUtf8(part.path)
	'Escapes every dollar sign so that they're not ignored by the regexp substitution
	partContent = Replace(partContent, "$", "$$")
	set funcMatcher = new RegExp
	funcMatcher.multiLine = true
	funcMatcher.pattern = "(async )?function " + fso.getBaseName(part) + "\(.*\) {[\S\s]+?^}$\r\n"
	if funcMatcher.execute(buildContent).count = 0 then
		lost = lost + fso.getBaseName(part) + " not found" + vbNewLine
	end if
	buildContent = funcMatcher.replace(buildContent, partContent)
next
writeAsUtf8 buildPath, buildContent
writeAsUtf8 metaPath, readMetaAsUtf8(buildPath)
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
	dim fileContent : fileContent = stream.readText
	stream.close
	readAsUtf8 = fileContent
end function

function readMetaAsUtf8(filePath)
	set stream = createObject("ADODB.Stream")
	stream.type = adTypeText
	stream.open
	stream.charset = "UTF-8"
	stream.loadFromFile filePath
	dim content
	'Read the first 4 lines : opening block, name, namespace, and version
	for n = 1 to 4
		content = content + stream.readText(adReadLine) + vbCrlf
	next
	content = content + "// ==/UserScript==" + vbCrlf
	stream.close
	readMetaAsUtf8 = content
end function

sub writeAsUtf8(filePath, content)
	set textStream = createObject("ADODB.Stream")
	textStream.type = adTypeText
	textStream.open
	textStream.charset = "UTF-8"
	textStream.writeText content
	textStream.position = 3 'Skips the BOM characters
	set binStream = createObject("ADODB.Stream")
	binStream.type = adTypeBinary
	binStream.open
	textStream.copyTo binStream
	textStream.close
	binStream.saveToFile filePath, adSaveCreateOverWrite
	binStream.close
end sub
