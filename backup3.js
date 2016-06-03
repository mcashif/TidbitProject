
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

		var _jsonOBJ      = [];


		// Changes XML to JSON
		function xmlToJson(xml) {


			obj = {}

			obj ["name"] = "cat";
      obj ["childern"] = [];







				return obj;

		}

		// Changes XML to JSON
		function xmlToJsonX(xml) {


								// Create the return object
								var obj = {};



								// do children
									if (xml.hasChildNodes()) {
										for(var i = 0; i < xml.childNodes.length; i++) {
											var item = xml.childNodes.item(i);
											var nodeName = item.nodeName;
										//	if (typeof(obj[nodeName]) == "undefined") {
												obj["name"]=nodeName;
												obj[nodeName] = [xmlToJsonX(item)];
										/*	} else {
												if (typeof(obj[nodeName].push) == "undefined") {
													var old = obj[nodeName];
													obj[nodeName] = [];
													obj[nodeName].push(old);
												}
												obj[nodeName].push(xmlToJsonX(item));
											}*/
										}
									}

					return obj;

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
		      _cleanXML(child);
		    }
		  }
		}

	function _traverseDOM(node, func){
		func(node);
		node = node.firstChild;
		while (node){
			_traverseDOM(node, func);
			node = node.nextSibling;
		}



	}

	function processNode(node,process){

			if (node.nodeType!==1 && !_isCommentNode(node)){ // exit unless regular node or comment
				return;
			}

			var realNextSib = _getRealNextSibling(node),
			    hasChild = _hasRealChild(node),
			    nodeJson    = _self.getNodeJSON(node, !realNextSib, hasChild);

					if(!hasChild)
					  _jsonOBJ["childern"].push(nodeJson);
					else
			    _jsonOBJ.push(nodeJson);

		}

	function _getRealNextSibling(node){
			do { node = node.nextSibling; }
			while (node && node.nodeType!==1);
			return node;
		}

		function _hasRealChild(node){

			   if(node.childNodes.length>1)
				    return true;

				 if(node.childNodes.length===1)
				    if(node.childNodes[0].nodeType!==3)
						   return true;

				 return false;

			}




		/**
		 * Removes node from XML (and displayed HTML representation)
		 * @param $link {Object}
		 * @param name  {String}
		 */
		function _removeNode(node){

				node.remove();

		}



		/**
		 * @param  node {Object}
		 * @return {Boolean}
		 */
		function _isCommentNode(node){
			return (node.nodeType===8);
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
		 * Returns an HTML string representing node attributes
		 * @param  node {Object} DOM object
		 * @return {String}
		 */
		function _getNodeAttributes(node){
			if (!node.attributes){
				return "";
			}
			var attrsStr  = "[",
					totalAttrs = node.attributes.length;
			for (var i=0; i<totalAttrs; i++){
				attrsStr += "{"+node.attributes[i].name+":" + node.attributes[i].value + "}"
			}
			attrsStr += "]";
			return attrsStr;
		}

	var _self = {

		 xml        : {}, // variable will hold the XML DOM object

		 /**
 		 * Returns HTML representation of passed node.
 		 * Used during initial render, as well as when creating new child nodes.
 		 * @param node   {Object}
 		 * @param state  {String}  Ex: "expandable"
 		 * @param isLast {Boolean} Indicates whether there are additional node siblings
 		 * @returns {String}
 		 * @TODO replace anchor with button
 		 */
 		getNodeJSON: function(node, isLast, hasChild){


 			var nodeValue    = _getNodeValue(node),
 					nodeAttrs    = _getNodeAttributes(node),
 					nodeObj      = {};

      { // display regular node

             if(hasChild){

							 nodeObj ["name"] = node.nodeName;
							 nodeObj ["childern"] = [];

							}
							else{

								nodeObj ["name"] = node.nodeName;
								nodeObj ["size"] = "30921";

							}

			}


 			return nodeObj;

 		},

		processXML: function(){


           _cleanXML(_self.xml)
          // _traverseDOM(_self.xml,processNode);
					 obj=JSON.stringify(xmlToJsonX(_self.xml));

					  window.location = "data:text/html," + obj

 		},


		/**
		 * Loads file path from the first argument via Ajax and makes it available as XML DOM object.
		 * Sets the $container which will hold the HTML tree representation of the XML.
		 * @param xmlPath           {String} Path to XML file
		 * @param containerSelector {String} CSS query selector for creating jQuery reference to container
		 * @param callback          {Function}
		 */
		loadXmlFromFile: function(xmlPath,callback){
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
