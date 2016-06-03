

//***********************************************************************
// Main function. Clears the given xml and then starts the recursion
//***********************************************************************
function xml2json(xmlStr){
	xmlStr = cleanXML(xmlStr);
 return xml2jsonRecurse(xmlStr,0);
}

//***********************************************************************
// Recursive function that creates a JSON object with a given XML string.
//***********************************************************************
function xml2jsonRecurse(xmlStr) {
    var obj = {},
        tagName, indexClosingTag, inner_substring, tempVal, openingTag;

    while (xmlStr.match(/<[^\/][^>]*>/)) {
        openingTag = xmlStr.match(/<[^\/][^>]*>/)[0];
        tagName = openingTag.substring(1, openingTag.length - 1);
        indexClosingTag = xmlStr.indexOf(openingTag.replace('<', '</'));

        // account for case where additional information in the openning tag
        if (indexClosingTag == -1) {

            tagName = openingTag.match(/[^<][\w+$]*/)[0];
            indexClosingTag = xmlStr.indexOf('</' + tagName);
            if (indexClosingTag == -1) {
                indexClosingTag = xmlStr.indexOf('<\\/' + tagName);
            }
        }
        inner_substring = xmlStr.substring(openingTag.length, indexClosingTag);
        if (inner_substring.match(/<[^\/][^>]*>/)) {
            tempVal = xml2json(inner_substring);
        }
        else {
            tempVal = inner_substring;
        }
        // account for array or obj //
        if (obj[tagName] === undefined) {
            obj[tagName] = tempVal;
        }
        else if (Array.isArray(obj[tagName])) {
            obj[tagName].push(tempVal);
        }
        else {
            obj[tagName] = [obj[tagName], tempVal];
        }

        xmlStr = xmlStr.substring(openingTag.length * 2 + 1 + inner_substring.length);
    }

    return obj;
}

//*****************************************************************
// Removes some characters that would break the recursive function.
//*****************************************************************
function cleanXML(xmlStr) {

    xmlStr = String(xmlStr).replace( /<!--[\s\S]*?-->/g, '' ); //remove commented lines
    xmlStr = String(xmlStr).replace(/\n|\t|\r/g, ''); //replace special characters
    xmlStr = String(xmlStr).replace(/ {1,}<|\t{1,}</g, '<'); //replace leading spaces and tabs
    xmlStr = String(xmlStr).replace(/> {1,}|>\t{1,}/g, '>'); //replace trailing spaces and tabs
    xmlStr = String(xmlStr).replace(/<\?[^>]*\?>/g, ''); //delete docType tags

    xmlStr = replaceSelfClosingTags(xmlStr); //replace self closing tags
    xmlStr = replaceAloneValues(xmlStr); //replace the alone tags values
    xmlStr = replaceAttributes(xmlStr); //replace attributes

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

            newTag += closingTag;

            xmlStr = xmlStr.replace(oldTag, newTag);
        }
    }

    return xmlStr;
}

//*************************************************************************************************
// Replaces all the tags with attributes and a value with a new tag.
//
// Example : '<tagName attrName="attrValue">tagValue</tagName>' becomes
//           '<tagName><attrName>attrValue</attrName><_@attribute>tagValue</_@attribute></tagName>'
//*************************************************************************************************
function replaceAloneValues(xmlStr) {

    var tagsWithAttributesAndValue = xmlStr.match(/<[^\/][^>][^<]+\s+.[^<]+[=][^<]+>{1}([^<]+)/g);

    if (tagsWithAttributesAndValue) {
        for(var i = 0; i < tagsWithAttributesAndValue.length; i++) {

            var oldTag = tagsWithAttributesAndValue[i];
            var oldTagName = oldTag.substring(0, oldTag.indexOf(">") + 1);
            var oldTagValue = oldTag.substring(oldTag.indexOf(">") + 1);

            var newTag = oldTagName + "<_@ttribute>" + oldTagValue + "</_@ttribute>";

            xmlStr = xmlStr.replace(oldTag, newTag);
        }
    }

    return xmlStr;
}

//*****************************************************************************************************************
// Replaces all the tags with attributes with another tag containing its attribute as a property.
// The function works if the tag contains multiple attributes.
//
// Example : '<tagName attrName="attrValue"></tagName>' becomes '<tagName><attrName>attrValue</attrName></tagName>'
//*****************************************************************************************************************
function replaceAttributes(xmlStr) {

    var tagsWithAttributes = xmlStr.match(/<[^\/][^>][^<]+\s+.[^<]+[=][^<]+>/g);

    if (tagsWithAttributes) {
        for (var i = 0; i < tagsWithAttributes.length; i++) {

            var oldTag = tagsWithAttributes[i];
            var tagName = oldTag.match(/[^<][\w+$]*/)[0];
            var newTag = "<" + tagName + ">";
            var attrs = oldTag.match(/(\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?/g);

            if (attrs) {
                for(var j = 0; j < attrs.length; j++) {

                    var attr = attrs[j];
                    var attrName = attr.substring(0, attr.indexOf('='));
                    var attrValue = attr.substring(attr.indexOf('"') + 1, attr.lastIndexOf('"'));

                    newTag += "<" + attrName + ">" + attrValue + "</" + attrName + ">";
                }
            }

            xmlStr = xmlStr.replace(oldTag, newTag);
        }
    }

    return xmlStr;
}

/*
	Copyright (c) 2010 Aleksandar Kolundzija <ak@subchild.com>
	Version 1.5

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.

	@TODO:
	Consider spliting app into modules: Loader, Renderer, Modifier, Writer

	Support comment editing and creation

	Attribute editing/creation:
		- removal of attributes needs work
		- typing should expand field width?
		- support blur for saves?

	Node editing/creation:
		- create node: add support for cancel (not remove)
		- support node renaming
		- support blur for saves?

	- for invalid XML, present link to XML in browser window since it displays specific error
	- use GIF for logo so IE6 likes
	- add support for session based temp directories
	- better messaging
	- add support for creating a new XML document from scratch
	- DTD/XSD generation and exporting
	- auto save
	- revert option
	- support for UNDO
*/

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





/**
 * xmlEditor
 * Loads an XML file and renders it as an editable HTML tree.
 * Editing updates original XML DOM in real-time.  Updated XML can
 * be viewed/saved.
 */
var xmlEditor = (function(){

	// private members //////////////////////////////////////////////////////
	var _nodeRefs      = [],    // will hold references to XML nodes
			_initNodeState = "expandable",
			_$event        = $({}), // beforeHtmlRendered, afterHtmlRendered, beforeToggleNode, afterToggleNode
			_message       = {
				"renderingHtml"     : "Rendering XML structure...",
				"readyToEdit"       : "Ready to edit.",
				"removeAttrConfirm" : "Are you sure want to delete this attribute and its value?",
				"invalidAttrName"   : "The attribute name you entered is invalid.\nPlease try again.",
				"invalidNodeName"   : "The node name you entered is invalid.\nPlease try again.",
				"noTextValue"       : "(No text value. Click to edit.)",
				"removeNodeSuccess" : "Removed node.",
				"removeNodeConfirm" : "Are you sure you want to remove this node?",
				"xmlLoadSuccess"    : "XML file was loaded successfully.",
				"xmlLoadProblem"    : "There was a problem loading XML file."
			};


	/**
	 * Visits every node in the DOM and runs the passed function on it.
	 * @TODO extend to support processing in chunks using setTimeout()s
	 * @TODO move to renderer component
	 */
	function _traverseDOM(node, func){
		func(node);
		node = node.firstChild;
		while (node){
			_traverseDOM(node, func);
			node = node.nextSibling;
		}
	}

  var obj;

	// Changes XML to JSON
	function xmlToJson(xml) {

	  // Create the return object


	  if (xml.nodeType == 1) { // element
	    // do attributes
			 obj+="id:"+ "\"" +xml.nodeName+ "\""+ "," ;
			 obj+="name:"+ "\"" +xml.nodeName + "\""+ "," ;
			 obj+="data:"+ "{}"+ "," ;
			 obj+="children:[" ;
	  }

	  // do children
	  if (xml.hasChildNodes()) {

	    for (var i = 0; i < xml.childNodes.length; i++) {
	        var item = xml.childNodes.item(i);
					if (item.nodeType == 1){
					      obj+="{" ;
                xmlToJson(item);
								if(_getRealNextSibling(item))
								   obj+="]}," ;
								else {
										if (item.nodeType == 1)
												obj+="]}" ;
								}
							}
	    }

	  }

	  return obj+="}";
	};


	// Changes XML to JSON
	function xmlToJson2(xml) {

		// Create the return object
  if (xml.nodeType == 1) { // element
    // do attributes
    if (xml.attributes.length > 0) {
        obj["@attributes"] = {};
        for (var j = 0; j < xml.attributes.length; j++) {
            var attribute = xml.attributes.item(j);
            obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
        }
    }
  } else if (xml.nodeType == 3) { // text
    obj = xml.nodeValue;
  }

  // do children
  if (xml.hasChildNodes()) {
    for (var i = 0; i < xml.childNodes.length; i++) {
        var item = xml.childNodes.item(i);
        var nodeName = item.nodeName;
        if (typeof(obj[nodeName]) == "undefined") {
            obj[nodeName] = xmlToJson2(item);
        } else {
            if (typeof(obj[nodeName].push) == "undefined") {
                var old = obj[nodeName];
                obj[nodeName] = [];
                obj[nodeName].push(old);
            }
            obj[nodeName].push(xmlToJson2(item));
        }
    }
  }
  return obj;

};


	/**
	 * @param  node {Object}
	 * @return {Boolean}
	 */
	function _isCommentNode(node){
		return (node.nodeType===8);
	}


	/**
	 * Retrieves XML node using nodeIndex attribute of passed $elem
	 * @param $elem {Object} jQuery DOM element
	 * @return XML node
	 */
	function _getNodeFromElemAttr($elem){
		var nodeRefIndex = $elem.closest("li.node").attr("nodeIndex"); // $elem.attr("nodeIndex");
		return _nodeRefs[nodeRefIndex];
	}


	/**
	 * Returns a string representing path to passed node. The path is not unique
	 * (same path is returned for all sibling nodes of same type).
	 */
	function _getNodePath(node){
		var pathArray = [];
		do {pathArray.push(node.nodeName); }
		while ( (node = node.parentNode) && (node.nodeName.toLowerCase()!=="#document") );
		return (pathArray.reverse()).join(" > ").toLowerCase();
	}


	/**
	 * Binds custom event to private _$event object
	 */
	function _bind(eventName, dataOrFn, fnOrUndefined){
		_$event.bind(eventName, dataOrFn, fnOrUndefined);
	}


	/**
	 * Unbinds custom event from private _$event object
	 */
	function _unbind(eventName, fn){
		_$event.unbind(eventName, fn);
	}


	/**
	 * Returns an HTML string representing node attributes
	 * @param  node {Object} DOM object
	 * @return {String}
	 */
	function _getEditableAttributesHtml(node){
		if (!node.attributes){
			return "";
		}
		var attrsHtml  = "<span class='nodeAttrs'>",
				totalAttrs = node.attributes.length;
		for (var i=0; i<totalAttrs; i++){
			attrsHtml += "<span class='singleAttr'>"+node.attributes[i].name +
										"=\"<span class='attrValue' name='"+node.attributes[i].name+"'>" +
										((node.attributes[i].value==="")?"&nbsp;":node.attributes[i].value) +
										"</span>\"</span>";
		}
		attrsHtml += "<button class='addAttr icon'/></span>";
		return attrsHtml;
	}


	/**
	 * Retrieves non-empty text nodes which are children of passed XML node.
	 * Ignores child nodes and comments. Strings which contain only blank spaces
	 * or only newline characters are ignored as well.
	 * @param  node {Object} XML DOM object
	 * @return jQuery collection of text nodes
	 */
	function _getTextNodes(node){
		return $(node).contents().filter(function(){
			return (
				((this.nodeName=="#text" && this.nodeType=="3") || this.nodeType=="4") && // text node, or CDATA node
				($.trim(this.nodeValue.replace("\n","")) !== "") // not empty
			);
		});
	}


	/**
	 * Retrieves (text) node value
	 * @param node {Object}
	 * @return {String}
	 */
	function _getNodeValue(node){
		var $textNodes = _getTextNodes(node),
				textValue  = (node && _isCommentNode(node)) ? node.nodeValue : ($textNodes[0]) ? $.trim($textNodes[0].textContent) : "";
		return textValue;
	}


	/**
	 * Detects if passed node has next sibling which is not a text node
	 * @param  node {Object} XML DOM object
	 * @return node or false
	 */
	function _getRealNextSibling(node){
		do { node = node.nextSibling; }
		while (node && node.nodeType!==1);
		return node;
	}


	/**
	 * Toggles display by swapping class name (collapsed/expanded) and toggling
	 * visibility of child ULs.
	 * @TODO make use of setTimeouts to address delay when many children
	 * @TODO if only allowing single expanded node at a time, will need to collapse others
	 */
	function _toggleNode(){
		_$event.trigger("beforeToggleNode");
		var $thisLi = $(this);
		$thisLi.find(">ul").toggle("normal"); // animate({height:"toggle"});
		if ($thisLi.hasClass("collapsable")){
			$thisLi.removeClass("collapsable").addClass("expandable");
		}
		else {
			$thisLi.removeClass("expandable").addClass("collapsable");
		}
		_$event.trigger("afterToggleNode");
	}


	/**
	 * Returns number of XML nodes
	 * @TODO Includes text nodes.  Should it?
	 */
	function _getXmlNodeCount(){
		return $('*', _self.xml).length;
	}



	var _self = {

		xml        : {}, // variable will hold the XML DOM object
		$container : $(document.body), // initialize as body, but should override with specific container


		log: function(){}, // empty function. installed via $.loggable()


		/**
		 * Assigns handlers for editing nodes and attributes. Happens only once, during renderAsHTML()
		 */
		assignEditHandlers: function(){
			$("#xml")
				.delegate("span.nodeName", "click", function(){
					_toggleNode.apply($(this).parent().get(0));
				})
				.delegate("div.hitarea", "click", function(){
					_toggleNode.apply($(this).parent().get(0));
				})
				.delegate("p.nodeValue", "click", function(){
					var $this = $(this),
						node  = _getNodeFromElemAttr($this);
					_self.editValue($this, node, _getNodeValue(node));
				})
				.delegate("a.addChild", "click", function(e){
					e.preventDefault();
					var $this = $(this),
						node  = _getNodeFromElemAttr($this);
					_self.createChild($this, node);
				})
				.delegate("span.attrValue", "click", function(){
					var $this= $(this),
						node = _getNodeFromElemAttr($this);
					_self.editAttribute($this, node, $this.attr("name"), $this.text());
				})
				.delegate("button.addAttr", "click", function(e){
					e.preventDefault();
					var $this = $(this),
						node  = _getNodeFromElemAttr($this);
					_self.createAttribute($this, node);
				})
				.delegate("button.killNode", "click", function(e){
					e.preventDefault();
					var $this = $(this),
						node  = _getNodeFromElemAttr($this);
					_self.removeNode($this, node);
				})
				.delegate("button.icon", "mouseover", function(){
					$(this).css({opacity:1});
				})
				.delegate("button.icon", "mouseout", function(){
					$(this).css({opacity:0.5});
				})
				.delegate("li.node", "mouseover", function(){
					var $this = $(this),
						node  = _getNodeFromElemAttr($this);
					$("#nodePath").text(_getNodePath(node));
				})
				.delegate("li.node", "mouseout", function(){
					$("#nodePath").empty();
				})
				.delegate("input:checkbox", "change", function(){

					// If checked
					 if (this.checked)
									$(":checkbox[name=" + this.name + "]").attr('checked', true);
					 else
									$(":checkbox[name=" + this.name + "]").attr('checked', false);


				});
		},


		/**
		 * Returns HTML representation of passed node.
		 * Used during initial render, as well as when creating new child nodes.
		 * @param node   {Object}
		 * @param state  {String}  Ex: "expandable"
		 * @param isLast {Boolean} Indicates whether there are additional node siblings
		 * @returns {String}
		 * @TODO replace anchor with button
		 */
		getNewNodeHTML: function(node, state, isLast){
			var nodeIndex    = _nodeRefs.length-1,
					nodeValue    = _getNodeValue(node),
					nodeAttrs    = _getEditableAttributesHtml(node);

					if (_isCommentNode(node)){ // display comment node
					nodeHtml = ']' ;
					}
					else {
				  nodeHtml = 'name:' + node.nodeName + ',' ;
					nodeHtml += 'childern:' + '[' ;

				  if(isLast)
					   nodeHtml += '},' ;
					 }


			return nodeHtml;
		},




		/**
		 * Renders XML as an HTML structure.  Uses _traverseDOM() to render each node.
		 * @TODO Explore use of documentFragment to optimize DOM manipulation
		 */
		renderAsHTML: function(){
			var $parent = _self.$container.empty(),
					$trueParent,
					parentRefs = [], // hash of references to previous sibling's parents. used for appending next siblings
					parentRefIndex = 0;
			_$event.trigger("beforeHtmlRendered");
			_nodeRefs = []; // initialize node references (clear cache)
			/**
			 * local utility method for appending a single node
			 * @param node {Object}
			 */
			function appendNode(node){

				if (node.nodeType!==1 && !_isCommentNode(node)){ // exit unless regular node or comment
					return;
				}
				_nodeRefs.push(node); // add node to hash for future reference (cache)

				var $xmlPrevSib = $(node).prev(),
						realNextSib = _getRealNextSibling(node),
						nodeHtml    = _self.getNewNodeHTML(node, _initNodeState, !realNextSib);

						_self.jsonX+=nodeHtml;

			} // end of appendNode()



			//jsonX= xmlToJson(xml2json(_self.xml));
		//	jsonX+=";";
			window.location = "data:text/html," + jsonX

			$("*", _self.xml).removeAttr("parentRefIndex"); // clean up remaining parentRefIndex-es
			_self.assignEditHandlers(); // bind in core app afterHtmlRendered
			$("button.icon").css({opacity:0.5});
			_$event.trigger("afterHtmlRendered");
		},


		/**
		 * Sets value of node to the passed text. Existing value is overwritten,
		 * otherwise new value is set.
		 * @param node  {Object}
		 * @param value {String}
		 */
		setNodeValue : function(node, value){
			var $textNodes = _getTextNodes(node);
			if ($textNodes.get(0)) $textNodes.get(0).nodeValue = value;
			else node["textContent"] = value;
		},


		/**
		 * Displays form for creating new child node, then processes its creation
		 * @param $link {Object} jQuery object
		 * @param node  {Object}
	 	 * @TODO need to separate this into render vs modify components
	 	*/
		createChild: function($link, node){
			var $linkParent = $link.parent(),
					$field  = $("<input type='text' value='' class='newChild'/>"),
					$submit = $("<button class='submit'>Create Node</button>").click(processCreateChild);
					$cancel = $("<button class='killChild cancel'>Cancel</button>").click(function(){
						$(this).remove();
						$submit.remove();
						$field.remove();
						$link.show();
					});
			function processCreateChild(){
				var childNodeName = $field.val(),
						childNode,
						$parent,
						$child,
						$childName,
						$ulChildren;
				try {
					childNode = node.appendChild(_self.xml.createElement(childNodeName));
					_nodeRefs.push(childNode);
				}
				catch (e){
					GLR.messenger.inform({msg:_message["invalidNodeName"], mode:"error"});
					$field.val("").focus();
					return false;
				}
				$child      = $(_self.getNewNodeHTML(childNode, _initNodeState, true));
				$parent     = $linkParent.closest("li.node");
				$ulChildren = $parent.find("ul.children");
				if ($ulChildren.length){
					$ulChildren.find(">li.last").removeClass("last").find(">div.last").removeClass("last");
					$child.appendTo($ulChildren);
				}
				else {
					$parent.append("<ul class='children'></ul>");
					$ulChildren = $parent.find(">ul.children").append($child);
				}
				$child.find(">span.nodeName").css({backgroundColor:"#fffc00"}).animate({backgroundColor:"#ffffff"}, 1500);
				$child.find("button.icon").css({opacity:0.5});
				$field.remove();
				$submit.remove();
				$cancel.remove();
				$link.show();
			}
			$link.hide();
			$field.bind("keydown", function(e){
				if (e.keyCode==13 || e.keyCode==27){
					processCreateChild();
				}
			});
			$linkParent
				.append($field)
				.append($submit)
				.append($cancel);
		},


		/**
		 * Returns string representation of private XML object
		 */
		getXmlAsString: function(){
			return (typeof XMLSerializer!=="undefined") ?
				(new window.XMLSerializer()).serializeToString(_self.xml) :
				_self.xml.xml;
		},


		/**
		 * Converts passed XML string into a DOM element.
		 * @param xmlStr {String}
		 * @TODO Should use this instead of loading XML into DOM via $.ajax()
		 */
		getXmlDOMFromString: function(xmlStr){
			if (window.ActiveXObject && window.GetObject) {
				var dom = new ActiveXObject('Microsoft.XMLDOM');
				dom.loadXML(xmlStr);
				return dom;
			}
			if (window.DOMParser){
				return new DOMParser().parseFromString(xmlStr,'text/xml');
			}
			throw new Error( 'No XML parser available' );
		},


		/**
		 * Displays form for creating a new attribute and assigns handlers for storing that value
		 * @param $addLink {Object} jQuery object
		 * @param node     {Object}
		 * @TODO Try using an HTML block (string) instead, and assign handlers using delegate()
		 */
		createAttribute: function($addLink, node){
			var $parent = $addLink.parent(),
					$form   = $("<form></form>"),
					$name   = $("<input type='text' class='newAttrName'  name='attrName'  value=''/>"),
					$value  = $("<input type='text' class='newAttrValue' name='attrValue' value=''/>"),
					$submit = $("<button>Create Attribute</button>"),
					$cancel = $("<button class='cancel'>Cancel</button>");
			// private function for processing the values
			function processNewAttribute(){
				var aName  = $name.val(),
						aValue = $value.val();
				try {
					$(node).attr(aName, aValue);
				}
				catch (e){
					GLR.messenger.inform({msg:_message["invalidAttrName"],mode:"error"});
					$name.val("").focus();
					return false;
				}
				$form.remove();
				$("<span class='singleAttr'>"+aName+"=\"<span class='attrValue' name='"+aName+"'>" +
					((aValue==="")?"&nbsp;":aValue) +"</span>\"</span>").insertBefore($addLink);
				$parent
					.find("span.attrValue:last")
						.click( function(e){
							e.stopPropagation();
							_self.editAttribute($(this), node, aName, aValue);
						});
				$addLink.show();
			} // end of processNewAttribute()
			$form.submit(function(){ return false; })
				.append($name)
				.append("<span class='equals'>=</span>")
				.append($value)
				.append($submit)
				.append($cancel);
			$addLink.hide();
			$parent.append($form);
			$form.find("input").click(function(e){
				e.stopPropagation();
			});
			$form.find("input.newAttrName").bind("keydown", function(e){
				if (e.keyCode==13 || e.keyCode==27){
					return false;
				}
			});
			$form.find("input.newAttrValue").bind("keydown", function(e){
				if (e.keyCode==13 || e.keyCode==27){
					processNewAttribute();
				}
			});
			$name.focus();
			$submit.click(function(e){
				e.stopPropagation();
				e.preventDefault();
				processNewAttribute();
			});
			$cancel.click(function(e){
				e.stopPropagation();
				$form.remove();
				$addLink.show();
			});
		},


		/**
		 * Displays form for editing selected attribute and handles storing that value
		 * @param $valueWrap {Object}
		 * @param node       {Object}
		 * @param name       {String}
		 * @param value      {String}
		 */
		editAttribute: function($valueWrap, node, name, value){
			var fieldWidth = parseInt($valueWrap.width()) + 30,
					$field     = $("<input type='text' name='' value='"+value+"' style='width:"+fieldWidth+"px;'/>"),
					$killAttr  = $("<button class='killAttr icon'/>").click(function(e){
						e.stopPropagation();
						if (confirm(_message["removeAttrConfirm"])){
							$(node).removeAttr(name);
							$(this).parent().remove();
						}
					});
			function updateAttribute(){
				value = $field.val();
				$(node).attr(name, value); // update value in XML
				$field.remove();
				$killAttr.remove();
				if (value === "") value = "&nbsp;"
				$valueWrap.html(value).show();
			}
			$valueWrap.hide().after($field);
			$valueWrap.parent().append($killAttr);
			$field.get(0).focus();
			$field
				.bind("keydown", function(e){
					if (e.keyCode==13 || e.keyCode==27){
						updateAttribute();
					}
				})
				.click(function(e){
					e.stopPropagation();
				});
		},


		/**
		 * Displays form for editing text value of passed node, then processes new value
		 * @param $valueWrap {Object}
		 * @param node       {Object}
		 * @param name       {String}
		 * @TODO Wrap in form.editValue
		 * @TODO use delegate()
		 */
		editValue: function($valueWrap, node, value){
			var $field       = $("<textarea>"+value+"</textarea>"),
					$btnCancel   = $("<button class='cancel' style='float:left;'>Cancel</button>"),
					$btnSubmit   = $("<button class='submit' style='float:right;'>Set Text Value</button>"),
					$btnWrap     = $("<div class='editTextValueButtons'></div>").append($btnCancel).append($btnSubmit);
			$valueWrap.hide().parent().append($field).append($btnWrap);
			$field.get(0).focus();
			$btnSubmit.click(function(){
				value = $field.val();
				_self.setNodeValue(node, value); // update XML node value
				$valueWrap.text(value).show().parent().find("textarea, div.editTextValueButtons").remove();
			});
			$btnCancel.click(function(){
				$valueWrap.show().parent().find("textarea, div.editTextValueButtons").remove();
			});
		},


		/**
		 * Removes node from XML (and displayed HTML representation)
		 * @param $link {Object}
		 * @param name  {String}
		 */
		removeNode: function($link, node){
			if (confirm(_message["removeNodeConfirm"])){
				$(node).remove();
				var $prev = $link.parent().prev();
				if ($prev.length){
					$prev.addClass("last");
					$prev.find(">div.hitarea").addClass("last");
				}
				$link.parent().remove();
				GLR.messenger.inform({msg:_message["removeNodeSucess"], mode:"success"});
				return true;
			}
			return false;
		},


		/**
		 * Loads file path from the first argument via Ajax and makes it available as XML DOM object.
		 * Sets the $container which will hold the HTML tree representation of the XML.
		 * @param xmlPath           {String} Path to XML file
		 * @param containerSelector {String} CSS query selector for creating jQuery reference to container
		 * @param callback          {Function}
		 */
		loadXmlFromFile: function(xmlPath, containerSelector, callback){
			_self.$container = $(containerSelector);
			$.ajax({
				type     : "GET",
				async    : false,
				url      : xmlPath,
				dataType : "xml",
				error    : function(){ GLR.messenger.show({msg:_message["xmlLoadProblem"], mode:"error"}); },
				success  : function(xml){
					GLR.messenger.show({msg:_message["xmlLoadSuccess"], mode:"success"});
					console.dir(xml);
					_self.xml = xml;
					callback();
				}
			});
		},


		/**
		 * Creates a DOM representation of passed xmlString and stores it in the .xml property
		 * @param xmlPath           {String} Path to XML file
		 * @param containerSelector {String} CSS query selector for creating jQuery reference to container
		 * @param callback          {Function}
		 */
		loadXmlFromString: function(xmlString, containerSelector, callback){
			_self.$container = $(containerSelector);
			_self.xml        = _self.getXmlDOMFromString(xmlString);
			callback();
		},


		/**
		 * Calls methods for generating HTML representation of XML, then makes it collapsible/expandable


		 */


		renderTree: function(){


					 var labelType, useGradients, nativeTextSupport, animate;
					 var Log = {
						 elem: false,
						 write: function(text){
							 if (!this.elem)
								 this.elem = document.getElementById('log');
							 this.elem.innerHTML = text;
							 this.elem.style.left = (500 - this.elem.offsetWidth / 2) + 'px';
						 }
					 };

					 //jsonString= xml2json(_self.xml);
					 var xmlInput = new XMLSerializer().serializeToString(_self.xml);



					 // Call the xml2json function
					 var jsonOutput = xml2json(xmlInput);

					 // Beautify the JSON if needed
					 var beautifiedJson = JSON.stringify(jsonOutput, undefined, 4);

					 window.location = "data:text/html," + beautifiedJson



			    json=jsonString;
			    //end
			    //init Spacetree
			    //Create a new ST instance
			    var st = new $jit.ST({
			        //id of viz container element
			        injectInto: 'infovis',
			        //set duration for the animation
			        duration: 800,
			        //set animation transition type
			        transition: $jit.Trans.Quart.easeInOut,
			        //set distance between node and its children
			        levelDistance: 50,
			        //enable panning
			        Navigation: {
			          enable:true,
			          panning:true
			        },
			        //set node and edge styles
			        //set overridable=true for styling individual
			        //nodes or edges
			        Node: {
			            height: 20,
			            width: 60,
			            type: 'rectangle',
			            color: '#aaa',
			            overridable: true
			        },

			        Edge: {
			            type: 'bezier',
			            overridable: true
			        },

			        onBeforeCompute: function(node){
			            Log.write("loading " + node.name);
			        },

			        onAfterCompute: function(){
			            Log.write("done");
			        },

			        //This method is called on DOM label creation.
			        //Use this method to add event handlers and styles to
			        //your node.
			        onCreateLabel: function(label, node){
			            label.id = node.id;
			            label.innerHTML = node.name;
			            label.onclick = function(){
			            	if(normal.checked) {
			            	  st.onClick(node.id);
			            	} else {
			                st.setRoot(node.id, 'animate');
			            	}
			            };
			            //set label styles
			            var style = label.style;
			            style.width = 60 + 'px';
			            style.height = 17 + 'px';
			            style.cursor = 'pointer';
			            style.color = '#333';
			            style.fontSize = '0.8em';
			            style.textAlign= 'center';
			            style.paddingTop = '3px';
			        },

			        //This method is called right before plotting
			        //a node. It's useful for changing an individual node
			        //style properties before plotting it.
			        //The data properties prefixed with a dollar
			        //sign will override the global node style properties.
			        onBeforePlotNode: function(node){
			            //add some color to the nodes in the path between the
			            //root node and the selected node.
			            if (node.selected) {
			                node.data.$color = "#ff7";
			            }
			            else {
			                delete node.data.$color;
			                //if the node belongs to the last plotted level
			                if(!node.anySubnode("exist")) {
			                    //count children number
			                    var count = 0;
			                    node.eachSubnode(function(n) { count++; });
			                    //assign a node color based on
			                    //how many children it has
			                    node.data.$color = ['#aaa', '#baa', '#caa', '#daa', '#eaa', '#faa'][count];
			                }
			            }
			        },

			        //This method is called right before plotting
			        //an edge. It's useful for changing an individual edge
			        //style properties before plotting it.
			        //Edge data proprties prefixed with a dollar sign will
			        //override the Edge global style properties.
			        onBeforePlotLine: function(adj){
			            if (adj.nodeFrom.selected && adj.nodeTo.selected) {
			                adj.data.$color = "#eed";
			                adj.data.$lineWidth = 3;
			            }
			            else {
			                delete adj.data.$color;
			                delete adj.data.$lineWidth;
			            }
			        }
			    });
			    //load json data
			    st.loadJSON(json);
			    //compute node positions and layout
			    st.compute();
			    //optional: make a translation of the tree
			    st.geom.translate(new $jit.Complex(-200, 0), "current");
			    //emulate a click on the root node.
			    st.onClick(st.root);
			    //end
			    //Add event handlers to switch spacetree orientation.
			    var top = $jit.id('r-top'),
			        left = $jit.id('r-left'),
			        bottom = $jit.id('r-bottom'),
			        right = $jit.id('r-right'),
			        normal = $jit.id('s-normal');


			    function changeHandler() {
			        if(this.checked) {
			            top.disabled = bottom.disabled = right.disabled = left.disabled = true;
			            st.switchPosition(this.value, "animate", {
			                onComplete: function(){
			                    top.disabled = bottom.disabled = right.disabled = left.disabled = false;
			                }
			            });
			        }
			    };

			    top.onchange = left.onchange = bottom.onchange = right.onchange = changeHandler;
			    //end

		}


	};






	// Constructor stuff

//	_bind("beforeHtmlRendered", function(){ console.time("renderHtml"); });
//	_bind("afterHtmlRendered",  function(){ console.timeEnd("renderHtml"); });

	return loggable(_self, "xmlEditor");

})();
