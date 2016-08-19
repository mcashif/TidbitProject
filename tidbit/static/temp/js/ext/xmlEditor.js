
/**
 * Logable adds a log method to the passed object.
 * @param obj       {Object}  Object which will get a new log() method
 * @param objName   {String}  Optional parameter for displaying a string before each log output
 * @param debugMode {boolean} Optional switch for disabling logging
 */
var loggable = function(obj /* , objName, debugMode */){
	var objName   = arguments[1] || "",
			debugMode = (typeof arguments[2]!=="undefined") ? arguments[2] : true;
			prefix    = objName ? objName + ": " : "";
	obj.log = (function(prefix){
		return function(){
			if (debugMode && typeof console!=="undefined"){
				if (arguments.length){
					arguments[0] = prefix + arguments[0];
				}
				console.log.apply(null, arguments);
			}
		}
	})(prefix);
	return obj;
};


var xmlEditor = (function(){



	//*****************************************************************
// Removes some characters that would break the recursive function.
//*****************************************************************
function _cleanXMLStr(xmlStr) {

    xmlStr = xmlStr.replace( /<!--[\s\S]*?-->/g, '' ); //remove commented lines
    xmlStr = xmlStr.replace(/\n|\t|\r/g, ''); //replace special characters
    //xmlStr = xmlStr.replace(/ {1,}<|\t{1,}</g, '<'); //replace leading spaces and tabs
  //  xmlStr = xmlStr.replace(/> {1,}|>\t{1,}/g, '>'); //replace trailing spaces and tabs
    xmlStr = xmlStr.replace(/<\?[^>]*\?>/g, ''); //delete docType tags

  //  xmlStr = replaceSelfClosingTags(xmlStr); //replace self closing tags
    //xmlStr = replaceAloneValues(xmlStr); //replace the alone tags values
  //  xmlStr = replaceAttributes(xmlStr); //replace attributes

    return xmlStr;
}

//************************************************************************************************************
// Replaces all the self closing tags with attributes with another tag containing its attribute as a property.
// The function works if the tag contains multiple attributes.
//
// Example : '<tagName attrName="attrValue" />' becomes
//           '<tagName><attrName>attrValue</attrName></tagName>'
//************************************************************************************************************
function replaceSelfClosingTags(xmlStr) {

    var selfClosingTags = xmlStr.match(/<[^/][^>]*\/>/g);

    if (selfClosingTags) {
        for (var i = 0; i < selfClosingTags.length; i++) {

            var oldTag = selfClosingTags[i];
            var tempTag = oldTag.substring(0, oldTag.length - 2);
            tempTag += ">";

            var tagName = oldTag.match(/[^<][\w+$]*/)[0];
            var closingTag = "</" + tagName + ">";
            var newTag = "<" + tagName + ">";

            var attrs = tempTag.match(/(\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?/g);

            if (attrs) {
                for(var j = 0; j < attrs.length; j++) {
                    var attr = attrs[j];
                    var attrName = attr.substring(0, attr.indexOf('='));
                    var attrValue = attr.substring(attr.indexOf('"') + 1, attr.lastIndexOf('"'));

                    newTag += "<" + attrName + ">" + attrValue + "</" + attrName + ">";
                }
            }

            newTag += " "+closingTag;

            xmlStr = xmlStr.replace(oldTag, newTag);
        }
    }

    return xmlStr;
}

function _cleanXML2(node)
{
	for(var n = 0; n < node.childNodes.length; n ++)
	{
		var child = node.childNodes[n];
		if
		(
			child.nodeType === 8
			||
			(child.nodeType === 3 && !/\S/.test(child.nodeValue))
		)
		{
			node.removeChild(child);
			n --;
		}
		else if(child.nodeType === 1)
		{
			_cleanXML(child);
		}
	}
}

		function _cleanXML(node)
		{
		  for(var n = 0; n < node.childNodes.length; n ++)
		  {
		    var child = node.childNodes[n];
			 if
		    (
		      child.nodeType === 8
		      ||
		      (child.nodeType === 3 && !/\S/.test(child.nodeValue))
		    )
		    {
		      node.removeChild(child);
		      n --;
		    }
		    else if(child.nodeType === 1)
		    {

					if(_isNodeEmpty(child)){
					  node.removeChild(child);
		           n --;
						 }

		      _cleanXML(child);
		    }
		  }
		}

		function _isNodeEmpty(node){

			   if(node.childNodes.length>1)
				    return false;


				 if(node.childNodes.length===1 && !(/[^\t\n\r ]/.test(node.childNodes[0].textContent)))
						   		 return true;

				 return false;

			}

	var _self = {

		 xml        : {}, // variable will hold the XML DOM object

		renderTree: function(){


      xmlstr = new XMLSerializer().serializeToString(_self.xml);

			xmlstr = _cleanXMLStr(xmlstr);

			_self.xml= $.parseXML(xmlstr)

      _cleanXML(_self.xml)

			new XMLTree({
				 xml: _self.xml,
				 container: "#tree",
				 startExpanded: true
			 });

 		},


		/**
		 * Loads file path from the first argument via Ajax and makes it available as XML DOM object.
		 * Sets the $container which will hold the HTML tree representation of the XML.
		 * @param xmlPath           {String} Path to XML file
		 * @param containerSelector {String} CSS query selector for creating jQuery reference to container
		 * @param callback          {Function}
		 */
		loadXmlFromFile: function(xmlPath,containerSelector,callback){
			_self.$container = $(containerSelector);
			$.ajax({
				type     : "GET",
				async    : false,
				url      : xmlPath,
				dataType : "xml",
				error    : function(){},
				success  : function(xml){
					_self.xml = xml;
					callback();
				}
			});
		}

	};

	return loggable(_self, "xmlEditor");

})();
