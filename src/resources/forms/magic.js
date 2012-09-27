/* $Header: /cvs/cvs_archive/LawsonPlatform/ui/portal/forms/magic.js,v 1.123.2.25.4.54.6.16.2.24.2.7 2010/09/17 07:55:27 jomeli Exp $ */
/* $NoKeywords: $ */
/* LaVersion=8-)@(#)@9.0.1.6.405 2010-09-20 04:00:00 (201005) */
//-----------------------------------------------------------------------------
//	Proprietary Program Material
//	This material is proprietary to Lawson Software, and is not to be
//	reproduced or disclosed except in accordance with software contract
//	provisions, or upon written authorization from Lawson Software.
//
//	Copyright (C) 2000-2007 by Lawson Software. All Rights Reserved.
//	Saint Paul, Minnesota
//-----------------------------------------------------------------------------

var strTranslation = null;

function Magic(formWnd, portalWnd)
{
	this.formWnd=formWnd;
	this.portalWnd=portalWnd;
	this.portalObj=this.portalWnd.lawsonPortal;

	this.initialized=false;
	this.FYEO=false;
	this.oHTTP=null;
	this.visitedPushScr="";
	this.FC="";
	this.evtType="";
	this.rtnType="ALL";
	this.HK="";
	this.txnHK="";
	this.isFlowchart=false;
	this.strTranXML="<?xml version=\"1.0\"?><TRANSXML><CRITERIA/><TRAN/></TRANSXML>";
	this.oSortArray = null;
	this.oldTxn = null;

	try {
		var evt=this.formWnd.frmElement.getAttribute("evttype")
		if (evt) this.evtType=evt		// 'CHG' or ''
		var rtn=this.formWnd.frmElement.getAttribute("rtntype")
		if (rtn) this.rtnType=rtn		// 'ALL' or 'SEL'
	} catch (e) { }

	// rest of this is pointless without a token!
	if (!this.formWnd.strTKN)
		return;

	var tkn = this.formWnd.strTKN;
	var agsString = "<?xml version=\"1.0\"?>"
	agsString += "<X" + tkn + ">"
	agsString += "<" + tkn + ">"
	agsString += "<_OUT>XML</_OUT>"
	agsString += "<_CACHE>TRUE</_CACHE>"
	agsString += "<_PDL>" + this.formWnd.strPDL + "</_PDL>"
	agsString += "<_TKN>" + tkn + "</_TKN>"
	if (this.evtType=="CHG")
		agsString += "<_EVT>CHG</_EVT>"
	if (this.rtnType=="SEL")
		agsString += "<_RTN>SENT</_RTN>"
	agsString += "<_DATEFMT>ALL</_DATEFMT>"
	agsString += "<_f0>" + tkn + "</_f0>"
	agsString += "</" + tkn + ">"
	agsString += "</X" + tkn + ">"

	this.storage = new this.portalWnd.DataStorage(agsString);
	this.detailLineFlds = new Array();
	this.lastWorkflowReq="";
	this.lastWorkflowRes="";

	this.oClearableFlds = new Object();
	this.oClearableFlds.fldAry = new Array();
	this.oClearableFlds.indexAry = new Array();
	this.oClearableFlds.length = -1;

	this.formWnd.xslBuildCollections()

	this.netEnhanced = (this.portalWnd.oPortalConfig.getRoleOptionValue(
			"use_compact_transaction","0") == "1" ? true : false);
}

//-----------------------------------------------------------------------------
Magic.prototype.initialize=function()
{
	try	{
		if (!this.storage || this.storage.isEmptyDoc())
			return false;

		this.isFlowchart=(this.formWnd.strTKN.match(this.portalWnd.flowRE)
			? true : false);

		// hkey supplied?
		if (this.formWnd.strHKValue != "")
		{
			this.processHKey();
			return true;
		}

		// consume data buffer if available
		this.formWnd.keyColl.consumeBuffer()
		this.formWnd.lawformFillDefaults();
		this.formWnd.hiddenMap = new HiddenMap(true);
		this.formWnd.hiddenMap.createHiddenMap(this.formWnd.namColl);
		this.addPushBtnFields();

		if (this.formWnd.keyColl.keyBuffer
		&& (this.formWnd.keyColl.keyBuffer.state.doPush 
			|| this.formWnd.keyColl.keyBuffer.state.doDefine 
			|| (this.formWnd.keyColl.keyBuffer.state.doTransfer
				&& this.formWnd.keyColl.keyBuffer.state.crtio.Request == ""))
		&& !this.formWnd.keyColl.keyBuffer.state.skipInitialTxn)
		{
			var strFC = this.formWnd.strInquireFC
            if(this.formWnd.keyColl.keyBuffer.state.crtio.Request == "MANUALCFKEY")
            {
		        if(this.formWnd.keyColl.keyBuffer.state.crtio.PassXlt != "")
			        strFC = this.formWnd.keyColl.keyBuffer.state.crtio.PassXlt
            }
            else if(strFC=="")
				strFC=this.formWnd.strDefaultFC
			if(strFC!="")
			{
				this.setElement("_IGNREQD", "1");
				this.transact(strFC, true)	/// Updates UI
			}

			if(this.formWnd.keyColl.keyBuffer.state.agsError)
			{
				var errRet = this.procErrInPushedForm()
			}
		}
		else if (this.formWnd.keyColl.keyBuffer 
			&& this.formWnd.keyColl.keyBuffer.state.doTransfer)
		{
			if (this.formWnd.keyColl.keyBuffer.state.crtio.PassXlt != "")
			{
				this.setElement("_IGNREQD", "1");
				this.transact(this.formWnd.keyColl.keyBuffer.state.crtio.PassXlt, true)
			}
			this.setFormData()
		}
		else if (this.formWnd.frmElement.getAttribute("prefc"))
		{
			// if the parent is pages - Check if there is any default value specified in portal datasource
			if (this.formWnd.strHost.toLowerCase() == "page")
			{
				var pStorage = (this.formWnd.parent.page
						? this.formWnd.parent.page.dataSource
						: null);
				if (typeof(pStorage) != "undefined" && pStorage)
				{
					var lfn,fld,val;
					var loop = this.formWnd.reqColl.length;
					for (var i=0; i < loop; i++)
					{
						if(this.formWnd.reqColl.children(i).key != "1")continue;
						fld = this.formWnd.reqColl.children(i).fld
						lfn = this.formWnd.namColl.getItem(fld).nm
						if (lfn == "")continue;
						val = pStorage[lfn]
						if(val)
						{
							this.setElement(fld, val)
							this.setFormData(fld)
						}
					}
				}
			}

			// for a 'selected' fields type transaction we must also
			// retrieve those elements marked with rtn='1'
			if (this.rtnType=="SEL")
				this.getUIData()

			this.setElement("_IGNREQD", "1");
			this.transact(this.formWnd.frmElement.getAttribute("prefc"), true);
		}
		else
		{
			// No transaction performed... still update UI based on what values are available in magic
			this.setFormData()
		}
		this.initialized=true;
		return true;

	} catch(e) {
		this.portalWnd.oError.displayExceptionMessage(e,"forms/magic.js","initialize")
		return false;
	}
}

//-----------------------------------------------------------------------------
Magic.prototype.processHKey=function()
{
	if (this.formWnd.strHKValue == "")
		return;

	this.formWnd.lawformFillDefaults();
	this.formWnd.hiddenMap = new HiddenMap(true);
	this.formWnd.hiddenMap.createHiddenMap(this.formWnd.namColl);

	if (this.formWnd.strHKValue.substr(0,9)=="_JOBPARAM")
	{
		// going to batch token to edit job parameters
		var hkAry = this.formWnd.strHKValue.split("~");
		var userName = hkAry[2];
		var jobName = hkAry[3];
		var jobStep = hkAry[4];
		var strHK = this.portalWnd.createJobHK(jobName, userName);
		this.HK=strHK;
		this.setHK(strHK);

		if (jobStep)
			this.setElement("_STEPNBR", jobStep);
	}
	else if (this.formWnd.strHKValue.substr(0,10)=="_DATAPARAM")
	{
		// special form of hkey: name~value pairs
		var dataParms=this.formWnd.strHKValue.split("~~");
		var len=dataParms.length;
		for (var i = 1; i < len; i++)
		{
			var dParm=dataParms[i].split("~");
			var nmItem=this.formWnd.namColl.getNameItem(dParm[0]);
			if (nmItem)
				this.setFieldValue(nmItem.fld, dParm[1]);
		}
	}
	else
	{
		// standard hkey
		this.HK=this.formWnd.strHKValue;
		this.setHK()
	}
	this.getUIData()
	this.setElement("_IGNREQD", "1");
	this.transact("I", true)
	this.initialized = true
}

//-----------------------------------------------------------------------------
Magic.prototype.procErrInPushedForm=function()
{
	var key = this.formWnd.keyColl.keyBuffer.indexByField(
		this.formWnd.keyColl.keyBuffer.state.agsFldNbr.replace(/r\d+/, "r0"))
	if (key)
	{
		// just to make sure it is handled only once and it does not bring this 
		// error up if forms are pushed open from a different detail row
		this.formWnd.keyColl.keyBuffer.state.agsError = false
		var errFld = this.formWnd.keyColl.indexByKey(key.keyNbr)
		if(errFld.length == 0) return false;
		this.formWnd.formState.agsError=true
		var fldNbr =  errFld.length > 1
				? (errFld[1].fldNbr.indexOf("r") > 0 ? errFld[1].fldNbr : errFld[0].fldNbr)
				: errFld[0].fldNbr;
		this.formWnd.formState.agsMsgNbr=""
		this.formWnd.formState.crtio.Message = this.formWnd.keyColl.keyBuffer.state.crtio.Message
		this.setElement("Message", this.formWnd.formState.crtio.Message)
		this.formWnd.formState.agsFldNbr = fldNbr
		this.setElement("FldNbr", fldNbr)
		this.setElement("MsgNbr", this.formWnd.keyColl.keyBuffer.state.agsMsgNbr)
		return true;
	}
	return false;
}

//-----------------------------------------------------------------------------
Magic.prototype.setOKAction=function()
{
	if(!this.formWnd.keyColl.keyBuffer)
		return

	var form=this.formWnd.document.getElementById("form")

	// If there is a displayxlt, then set the hiddenFCOK to that value
	if((typeof(this.formWnd.keyColl.keyBuffer.state.crtio.DspXlt) != "undefined")
	&& (this.formWnd.keyColl.keyBuffer.state.crtio.DspXlt != "")
	&& (this.formWnd.keyColl.keyBuffer.state.crtio.Screen == this.formWnd.strTKN))
	{
		this.formWnd.strOKAction=this.formWnd.keyColl.keyBuffer.state.crtio.DspXlt
		var btn = this.portalWnd.document.getElementById("LAWTBBUTTONbtnOKForm")
		if (!btn)
			btn=this.formWnd.document.getElementById("LAWTBBUTTONbtnOKForm")
		if (btn)
		{
			btn.setAttribute("userdata", this.formWnd.strOKAction)
			this.formWnd.strDefaultFC=this.formWnd.strOKAction
		}
	}
	else if (this.formWnd.strOKAction != "")
	{
		var btn = this.portalWnd.document.getElementById("LAWTBBUTTONbtnOKForm")
		if (!btn)
			btn=this.formWnd.document.getElementById("LAWTBBUTTONbtnOKForm")
		if (btn)
		{
			btn.setAttribute("userdata", this.formWnd.strOKAction)
			this.formWnd.strDefaultFC=this.formWnd.strOKAction
		}
	}
	else if (form && form.getAttribute("hiddenFC") && form.getAttribute("hiddenFC")=="1"
		&& this.formWnd.formState.agsError && form.getAttribute("add"))
	{
		// Change the hidden FC if the initial inquire failed
		var btn = this.portalWnd.document.getElementById("LAWTBBUTTONbtnOKForm")
		if (!btn)
			btn=this.formWnd.document.getElementById("LAWTBBUTTONbtnOKForm")
		if (btn)
		{
			btn.setAttribute("userdata", form.getAttribute("add"))
			this.formWnd.strDefaultFC=this.formWnd.strOKAction
		}
	}
}

//-----------------------------------------------------------------------------
// send all the pushes up to AGS...else buttons may not paint!
Magic.prototype.addPushBtnFields=function()
{
	var i=0, j=0;
	var pushelem;
	var par, val, dtlRows=0;
	var nm, id, id1;
	var loop = this.formWnd.pushColl.length;
	for (i=0; i < loop; i++)
	{
		nm = this.formWnd.pushColl.children(i).id
		if (nm == "") continue;
		id=this.formWnd.pushColl.children(i).fld
		pushelem = this.formWnd.document.getElementById(id)
		if (pushelem)
		{
			this.setElement(id, pushelem.innerHTML)
			par = pushelem.getAttribute("det");
			if (par && par.indexOf("DT") >= 0)
			{
				par = this.formWnd.document.getElementById(par);
				if (par)
				{
					dtlRows = par.getAttribute("rows");
					for (j=1; j < dtlRows; j++) //row0 is already taken care off
					{
						id1 = id.replace(/r\d+/, "r"+j)
						this.setElement(id1, pushelem.innerHTML);
					}
				}
			}
		}
		else if (this.portalObj.xsltSupport)
		{
			var push = this.formWnd.lawForm.IEXML.selectSingleNode("//push[@nbr='"+id+"']")
			if (push)
			{
				val = (push.getAttribute("btnnm") 
						? this.portalWnd.trim(push.getAttribute("btnnm")) 
						: "");
				par = push.getAttribute("det")
				this.setElement(id, val);
				if (par && par.indexOf("DT") >=0)
				{
					par = this.formWnd.lawForm.IEXML.selectSingleNode("//detail[@nbr='"+par+"']")
					if (par)
					{
						dtlRows = par.getAttribute("height");
						for(j=1; j < dtlRows; j++)
						{
							id1=id.replace(/r\d+/, "r"+j)
							this.setElement(id1, val);
						}
					}
				}
			}
		}
	}
}

//-----------------------------------------------------------------------------
Magic.prototype.getElement=function(fldNo, rowNo)
{
	var strFieldNo = ""
	if(arguments.length < 2)
		strFieldNo = arguments[0]
	else
		strFieldNo = arguments[0].replace(/r\d+/, "r"+arguments[1])

	return (this.storage.getElementValue(strFieldNo));
}

//-----------------------------------------------------------------------------
Magic.prototype.setElement=function(fldNo, strVal, rowNo)
{
	if(arguments[0] == "" || typeof(arguments[0]) == "undefined")
		return false;
	var strFieldNo = "";
	if(arguments.length < 2)
		return false;
	strVal= (typeof(strVal) != "string" ? ""+strVal : strVal);

	if(arguments.length < 3)
		strFieldNo = arguments[0]
	else
		strFieldNo = arguments[0].replace(/r\d+/, "r"+arguments[2])

	if (!this.storage.setElementValue(strFieldNo, strVal))
	{
		var parNode = this.storage.document.documentElement.childNodes[0]
		var node = this.storage.document.createElement(strFieldNo)
		strVal=this.portalWnd.xmlDecodeString(strVal);
		node.appendChild(this.storage.document.createTextNode(strVal))
		parNode.appendChild(node)
	}
	return true
}

//-----------------------------------------------------------------------------
Magic.prototype.getElementNode=function(fldNo, rowNo)
{
	var strFieldNo = ""
	if(arguments.length < 2)
		strFieldNo = arguments[0]
	else
		strFieldNo = arguments[0].replace(/r\d+/, "r"+arguments[1])

	return (strFieldNo ? this.storage.getNodeByName(strFieldNo) : null);
}

//-----------------------------------------------------------------------------
Magic.prototype.buildHK=function(bUpdate)
{
    bUpdate = (typeof(bUpdate) == "boolean") ? bUpdate : true;

	var strHK="";
	var htmElem=null;
	var len=0;
	var loop = this.formWnd.reqColl.length;
	var frmType = this.formWnd.frmElement.getAttribute("type");

	for(var i=0; i < loop; i++)
	{
		var reqFld = this.formWnd.reqColl.children(i);
		if (reqFld.det.indexOf("DT") == 0)
			continue;

		if(frmType.toUpperCase()=="BATCH")
		{
			if(reqFld.keynbr != "@jn" && reqFld.keynbr != "@un")
				continue;
		}
		else
		{
			if(reqFld.key != "1")
				continue;
		}


		htmElem=this.formWnd.document.getElementById(reqFld.fld);
		if (htmElem && htmElem.getAttribute("edit"))
		{
			var value = this.getFieldValue(htmElem);
			var edit = htmElem.getAttribute("edit");
			var len = parseInt(htmElem.getAttribute("maxLength"));
		}
		else
		{
			var value = this.getElement(reqFld.fld);
			var edit = reqFld.edit;
			var len = parseInt(reqFld.size);
		}

		switch (edit)
		{
			case "numeric":
				// trim leading spaces incase the VALUE is padded with blanks
				value = this.portalWnd.trim(value)
				if(value.length < len)
				{
					while(len-value.length)
						value = "0" + value
				}
				strHK+=value
				break;
			case "date":
				var dt = this.portalWnd.edGetDateObject(value, len)
				if (dt && !isNaN(dt))
					strHK+=this.portalWnd.edFormatLawsonDate(dt)
				break;
			default:
				if(value.length < len)
				{
					while(len-value.length)
						value += " "
				}
				strHK+=value
				break;
		}
		if (htmElem && htmElem.getAttribute("edit") && bUpdate)
			this.setElement(htmElem.id, value)
	}
	return strHK;
}

//-----------------------------------------------------------------------------
Magic.prototype.setHK=function(strHK)
{
	if(typeof(strHK) == "undefined")
		strHK = this.formWnd.strHKValue;

	if(typeof(strHK) == "undefined" || strHK == "")
		return;

	var htmElem = null;
	var reqFld = null;
	var edit = null;
	var value = "";
	var len = null;
	var loop = this.formWnd.reqColl.length;

	for(var i=0; i < loop; i++)
	{
		reqFld = this.formWnd.reqColl.children(i);

		if(reqFld.key != "1")
			continue;

		htmElem=this.formWnd.document.getElementById(reqFld.fld);
		edit = reqFld.edit;
		len = parseInt(reqFld.size,10);
		if (edit && edit == "date" && len == 6)
			len = 8;

		value = strHK.substr(0,len);
		strHK = strHK.substr(len);

		if (edit && edit == "date")
		{
			var oDate = this.portalWnd.edGetDateObjectFromLawsonDate(value)
			value = (oDate && !isNaN(oDate)
				? this.portalWnd.edSetUserDateFormat(oDate, len)
				: "");
		}

		this.setElement(reqFld.fld, value);
		if (htmElem)
			this.setFieldValue(htmElem, value);
	}
}

//-----------------------------------------------------------------------------
Magic.prototype.setFormData=function(fldNo)
{
	if (typeof(fldNo) != "undefined")
	{
		var strVal = this.getElement(fldNo)
		this.setFieldValue(fldNo,strVal)
	}
	else if (!this.isFlowchart)
		this.setUIData()
}

//-----------------------------------------------------------------------------
Magic.prototype.setFormFields=function()
{
	var elmNodes = this.formWnd.document.getElementsByName("form")
	var loop = elmNodes.length;
	for (var i=0; i < loop; i++)
	{
		if (elmNodes[i].id.indexOf("_f") >= 0)
		{
			// check if this is a output field
			if(elmNodes[i].hasChildNodes()  && elmNodes[i].childNodes[0].nodeType == 3)
			{
				var newNode = this.formWnd.document.createTextNode(this.getElement(elmNodes[i].id))
				elmNodes[i].replaceChild(newNode, elmNodes[i].childNodes[0])
			}
			else
				elmNodes[i].value = this.getElement(elmNodes[i].id)		// todo for buttons??
		}
	}
}

//-----------------------------------------------------------------------------
Magic.prototype.setTabData=function(tabPane, rowNo)
{
	var k = 0;
	var initTranslation = new Array();
	var elmNodes = this.formWnd.document.getElementsByName(tabPane)
	var len = elmNodes.length;
	for(var i=0; i < len; i++)
	{
		if(elmNodes[i].getAttribute("tp") ==  "detail")
		{
			this.setDetailAreaData(elmNodes[i].getAttribute("nbr"))
		}
		else if (elmNodes[i].getAttribute("tp") == "tabregion")
		{
			var par = this.formWnd.document.getElementById(elmNodes[i].getAttribute("nbr"))
			if (par.childNodes && par.childNodes.length > 0 && par.childNodes[0].childNodes) {
				var len2 = par.childNodes[0].childNodes.length;
				for (var j = 0; j < len2; j++)
				{
					if ( par.childNodes[0] && par.childNodes[0].childNodes && par.childNodes[0].childNodes[j].className == "activeTab" )
						this.setTabData(par.childNodes[0].childNodes[j].id);
				}
			}
		}
		else if (elmNodes[i].id.indexOf("_f") >= 0)
		{
			this.checkSecuredfields(elmNodes[i].id)
			if(typeof(rowNo) != "undefined")
				this.setFieldValue(elmNodes[i].id, this.getElement(elmNodes[i].id.replace(/r\d+/, "r"+rowNo)))
			else
			{
				this.setFieldValue(elmNodes[i].id, this.getElement(elmNodes[i].id))
				if (strTranslation)
				{
					initTranslation[k] = strTranslation;
					strTranslation = null;
					k++;
				}
			}
		}
	}
	// take care of the outputs that does not get listed under getElementsByName
	var oTabPane = this.formWnd.document.getElementById(tabPane + "PANE")
	var outputNodes = oTabPane.getElementsByTagName("LABEL")
	len = outputNodes.length;
	k = 0;
	for (i=0; i < len; i++)
	{
		if (outputNodes[i].getAttribute("tp") == "out")
		{
			if(typeof(rowNo) != "undefined")
				this.setFieldValue(outputNodes[i].id, this.getElement(outputNodes[i].id.replace(/r\d+/, "r"+rowNo)))
			else
			{
				if (k<initTranslation.length)
				{
					var transIndex = initTranslation[k].lastIndexOf("_");
					var xlt = initTranslation[k].slice(transIndex);
					var transValue = initTranslation[k].slice(0,transIndex);
					if(xlt == outputNodes[i].id && this.getElement(outputNodes[i].id) != "")
					{
						this.setFieldValue(outputNodes[i].id, transValue);
						k++;
					}
					else
						this.setFieldValue(outputNodes[i].id, this.getElement(outputNodes[i].id))
				}
				else
					this.setFieldValue(outputNodes[i].id, this.getElement(outputNodes[i].id))				
			}
		}
	}
}

//-----------------------------------------------------------------------------
Magic.prototype.setDetailAreaData=function(detailNo)
{
	var detailArea = this.formWnd.document.getElementById(detailNo)
	var elmNodes = this.formWnd.document.getElementsByName(detailNo)
	var loop = elmNodes.length;
	for(var i=0; i<loop; i++)
	{
		if(elmNodes[i].getAttribute("tp") == "tabregion")
		{
			var par = this.formWnd.document.getElementById(detailArea.getAttribute("tabregion"))
			var loop2 = par.childNodes.length;
			for(var j = 0; j < loop2; j++)
			{
				if ( par.childNodes[j].className
				&& (par.childNodes[j].className == "tabPaneActive" 
				|| par.childNodes[j].className == "tabPaneActiveSub") )
				{
					// This is the first row
					this.setTabData(par.childNodes[j].id.substr(0, par.childNodes[j].id.indexOf("PANE")), 0)
				}
			}

		}
		else if(elmNodes[i].id.indexOf("_f") >= 0)
		{
			this.setFieldValue(elmNodes[i].id, this.getElement(elmNodes[i].id))
		}
	}
}

//-----------------------------------------------------------------------------
// getTabData gets called only on tabs subordinate to detail area, to update the MAGIC
Magic.prototype.getTabData=function(detailNo, rowNo)
{
	var da = this.formWnd.document.getElementById(detailNo)
	if(!da)return
	if(!da.getAttribute("tabregion") || da.getAttribute("tabregion") == "")return;
	var par = this.formWnd.document.getElementById(da.getAttribute("tabregion"))
	if (!par)return;
	var tabPane=null;
	var subElements=null;
	var outputNodes=null;
	var magicId
	var loop = par.childNodes.length;
	for(var i=0; i < loop; i++)
	{
		if(typeof(par.childNodes[i].id)=="undefined")continue;
		if(par.childNodes[i].id.indexOf("PANE")>= 0)
		{
			tabPane=par.childNodes[i]
			if (tabPane && tabPane.getAttribute("painted") == "true")
			{
				subElements = this.formWnd.document.getElementsByName(tabPane.id.substr(0, tabPane.id.indexOf("PANE")))
				var loop2 = subElements.length;
				for (var j=0; j < loop2; j++)
				{
					if(subElements[j].id.indexOf("_f") >= 0)
					{
						magicId = subElements[j].id.replace(/r\d+/, "r"+rowNo)
						this.setElement(magicId, this.getFieldValue(subElements[j]))
					}
				}
				outputNodes=tabPane.getElementsByTagName("LABEL")
				loop2 = outputNodes.length;
				for(j=0; j<loop2; j++)
				{
					if (outputNodes[j].getAttribute("tp") == "out")
					{
						magicId = outputNodes[j].id.replace(/r\d+/, "r"+rowNo)
						this.setElement(magicId, this.getFieldValue(outputNodes[j]))
					}
				}
			}
		}
	}
}

//-----------------------------------------------------------------------------
Magic.prototype.clearFormData=function(fldId)
{
	if(typeof(this.formWnd.FORM_OnBeforeClearForm)=="function")
	{
		if(!this.formWnd.FORM_OnBeforeClearForm(fldId))
			return false;
	}

	var oFormWnd = this.formWnd;
	var bClearAll = (typeof(fldId) != "string" ? true : false);
	var fldNbr = null;
	var oFld = null;
	var startDetailArea = null;
	var start = 0;
	var hkFld = oFormWnd.strHKFldNbr;
	var currentRow = parseInt(oFormWnd.formState.currentRow, 10);
	this.setClearableFlds();

	if(!bClearAll)
	{
		fldNbr = parseInt(fldId.replace(/\D{2}|r\d+/g, ""), 10);
		oFld = this.oClearableFlds.indexAry[fldNbr];
		startDetailArea = oFld.det;
		start = this.getFirstFldToClear(fldNbr);
	}

	var loop = this.oClearableFlds.length;
	for (var i=start; i < loop; i++)
	{
		var oNameFld = this.oClearableFlds.indexAry[this.oClearableFlds.fldAry[i]];

		if (!bClearAll && hkFld == oNameFld.fld)
			continue;

		var bDetailFld = (oNameFld.det.length == 0 ? false : true)
		if (bDetailFld)
		{
			var oDetail = oFormWnd.detailColl.getItem(oNameFld.det);
			var jLoop = oDetail.rows

			for (var j=0;j<jLoop;j++)
			{
				nameFldId = oNameFld.fld.replace(/r\d+/, "r"+j);
				nameFldNbr = parseInt(nameFldId.replace(/\D{2}|r\d+/g, ""), 10);

				if (!bClearAll && oNameFld.det == startDetailArea)
				{
					if((j > currentRow) || (j == currentRow && fldNbr <= nameFldNbr))
						this.clearField(oFormWnd, nameFldId);
				}
				else
					this.clearField(oFormWnd, nameFldId);
			}
		}
		else
			this.clearField(oFormWnd, oNameFld.fld);
	}
	//go to first detail area to update subordinate detail tabs
	frmSetActiveRow(oFormWnd, null, 0)
	frmSetActiveRow(oFormWnd, null, currentRow)
	oFormWnd.lawformFillDefaults();

	if(typeof(this.formWnd.FORM_OnAfterClearForm)=="function")
		this.formWnd.FORM_OnAfterClearForm();

	return true;
}

//-----------------------------------------------------------------------------
Magic.prototype.setClearableFlds=function()
{
	if(this.oClearableFlds.length != -1)
		return true;

	var oFormWnd = this.formWnd;
	var fldsToClearAry = new Array();
	var index = 0;
	var indexAry = new Array();

	//USE namColl, need to get list of non-rendered HTML elements (non painted tabs)
	var nameFldsAry = oFormWnd.namColl.names;
	var loop = nameFldsAry.length;

	for (var i=0; i< loop; i++)
	{
		var nameFld = nameFldsAry[i].fld; 

		if((nameFld.indexOf("_f") != -1) && (nameFld != "_f0") && (nameFld != "_f1"))
		{
			var pushFld = oFormWnd.pushColl.getItemByFld(nameFld);

			if(pushFld)
				continue;

			var nameFldNbr = parseInt(nameFld.replace(/\D{2}|r\d+/g, ""))
			fldsToClearAry[index] = nameFldNbr;
			index++;
			indexAry[nameFldNbr] = nameFldsAry[i];
		}
	}

	var frmId = oFormWnd.frmElement.getAttribute("formid");
	if(frmId)
	{
		if (!this.oSortArray)
			this.oSortArray = new this.portalWnd.SortArray(window);
		this.oSortArray.sortNumerics(fldsToClearAry);
	}

	this.oClearableFlds.fldAry = fldsToClearAry;
	this.oClearableFlds.indexAry = indexAry;
	this.oClearableFlds.length = index;

	return true;

}

//-----------------------------------------------------------------------------
Magic.prototype.getFirstFldToClear=function(fldNbr)
{
	var oFormWnd = this.formWnd;
	var oNameFld = this.oClearableFlds.indexAry[fldNbr];
	var bDetailFld = (oNameFld.det.length == 0 ? false : true);

	if(!bDetailFld)
	{
		var loop = this.oClearableFlds.length;

		for(var i=0;i<loop;i++)
		{
			if(fldNbr == this.oClearableFlds.fldAry[i])
				return i;
		}
	}
	else
	{
		var detailId = 	oNameFld.det;
		var htmDoc = oFormWnd.document
		var detailElement = htmDoc.getElementById(detailId);
		var loop = htmDoc.all.length;
		var start = detailElement.sourceIndex;

		for (var i=start;i<loop;i++)
		{
			var tmpElemId = htmDoc.all[i].id;

			if(tmpElemId.indexOf("_f") == 0)
			{
				tmpElemNbr = parseInt(tmpElemId.replace(/\D{2}|r\d+/g, ""));
				var jloop = this.oClearableFlds.length;

				for(var j=0;j<jloop;j++)
				{
					if(tmpElemNbr == this.oClearableFlds.fldAry[j])
						return j;
				}
			}
		}
	}

	return 0;
}

//-----------------------------------------------------------------------------
Magic.prototype.clearField=function(oFormWnd, fld)
{
	if(typeof(fld) != "string")
		return false;

	this.storage.setElementValue(fld, "");
	this.setFieldValue(fld,"");
	oFormWnd.lawformApplyXLTValue(fld);

	try{
		var htmElement = oFormWnd.document.getElementById(fld);
		oFormWnd.lawformSetStartVal(htmElement);
	}catch(e){}

	return true;
}

//-----------------------------------------------------------------------------
Magic.prototype.beginTransaction=function()
{
	this.formWnd.formState.crtio = new CRTIODataObj();
	this.processFYEO()
	this.getUIData()
	if(this.formWnd.formState.currentDetailArea != "")
		this.getTabData(this.formWnd.formState.currentDetailArea, this.formWnd.formState.currentRow)
	return;
}

//-----------------------------------------------------------------------------
Magic.prototype.transact=function(FC, bHasData)
{
	// returns true or false, most cases ignored, but in lawform.js, 
	// lawformDoFunction, will position in first field if true
	if(typeof(bHasData) == "undefined") bHasData = false

	this.setElement(this.formWnd.strFrmFCFldNbr, FC)
	this.FC=FC

	if (!bHasData)
		this.beginTransaction()

	this.formWnd.formState.agsError = false;
	this.formWnd.formState.agsFldNbr = "";
	this.formWnd.formState.agsMsgNbr = "";
	if (typeof(this.formWnd.FORM_OnBeforeTransaction)=="function")
	{
		if ((typeof oFrm != 'undefined') && this.formWnd && this.formWnd.parent && (typeof this.formWnd.parent.oFrm == 'undefined'))
			this.formWnd.parent.oFrm = oFrm;
		if(!this.formWnd.FORM_OnBeforeTransaction(FC))
			return false;
	}

	if (this.isKeycheckFc() && !this.keyMatch())
	{
		var errorMsg=this.portalWnd.erpPhrases.getPhrase("ERR_MUST_INQUIRE_FIRST");
		this.portalObj.setMessage(errorMsg);
		return false;
	}

	var oPkgDS = (this.netEnhanced
		? this.createTransactionPackage()
		: this.storage);
	if (!oPkgDS) return false;

	// call the transaction servlet
	var out = this.portalWnd.SSORequest(this.formWnd.strAGSPath,oPkgDS.document,"","",false);

	this.portalWnd.oError.setMessage(this.portalObj.getPhrase("FORM_DATA_ERROR")+"\n");
	if (this.portalWnd.oError.isErrorResponse(out,true,true,true,"",this.formWnd))
	{
		this.portalObj.setMessage("");
		return false;
	}

	if (out.getElementsByTagName("_JOBTYPE")[0] != null) 
	{
		if ((out.getElementsByTagName("_JOBTYPE")[0].text == "MULTISTEP") && 
			(this.formWnd.strHKValue.substr(0,9)!="_JOBPARAM"))
		{
			var errorMsg=this.portalWnd.erpPhrases.getPhrase("ERR_JOB_IS_MULTISTEP");
			this.portalObj.setMessage(errorMsg);
			return false;
		}
	}

	this.storage=this.portalWnd.oError.getDSObject();
	if (this.portalWnd.oBrowser.isIE)
		this.formWnd.agsReturn=out.xml;
	else
	{
		var ser=new XMLSerializer();
		this.formWnd.agsReturn=ser.serializeToString(out);
	}

	if (typeof(this.formWnd.FORM_OnAfterTransaction)=="function")
		this.formWnd.FORM_OnAfterTransaction(this.storage.document)

	var ret=this.endTransaction()

	// if no error, attempt workflow trigger
	if (!this.formWnd.formState.agsError)
		this.triggerWorkflow(FC);

	return ret
}

//-----------------------------------------------------------------------------
Magic.prototype.endTransaction=function()
{
	// if ags does return an error message, alert the user of error code
	var trMsgNbr = this.getElement("MsgNbr");
	var trMessage = this.getElement("Message");
	var trFldNbr = this.getElement("FldNbr");
	
	if (this.netEnhanced)
		this.oldTxn = new DataStorage(this.formWnd.agsReturn);
	
	if (trMessage == "" && trMsgNbr != "000")
	{
		var msg=this.portalObj.getPhrase("LBL_AGS_ERROR") + " " + trMsgNbr;
		this.portalWnd.cmnDlg.messageBox(msg,"ok","stop",this.formWnd);
	}

	if (!this.formWnd.formState.formReady)
	{
		if (trFldNbr != "" && trMsgNbr != "000")
		{
			this.formWnd.formState.agsError = true;
			this.formWnd.formState.agsFldNbr = trFldNbr;
			this.formWnd.formState.crtio.Message = trMessage;
			this.formWnd.formState.agsMsgNbr = trMsgNbr;
		}
		// assuming moving back to firstrow in a DA is not needed here.
		this.setFormData();
		if (trMessage)
			this.portalObj.setMessage(trMessage);
		this.formWnd.formState.tranAtEnd=true;
		this.txnHK=this.buildHK(false);
	}
	else
	{
		// move back to the first detail row
		this.portalWnd.frmSetActiveRow(this.formWnd, null, 0)
		this.setTabSecurity()
		this.setFormData();

		// determine if it resulted in error
		if (trFldNbr != "" && parseFloat(trMsgNbr,10)!=0)
		{
			this.formWnd.formState.agsError = true;
			this.formWnd.formState.agsFldNbr = trFldNbr;
			this.formWnd.formState.agsMsgNbr = trMsgNbr;
			this.formWnd.formState.crtio.Message = trMessage;
			this.txnHK=this.buildHK(false);
			this.FYEO = false;
			this.processError();
			return false;
		}

		// process CRTIO
		if (this.getElement("Request")!="")
		{
			if (this.magicCRTIO())
			{
			    this.FYEO = false;
				this.txnHK=this.buildHK(false);
			    return true;
            }
		}

		// update portal page (parent)
		if (this.formWnd.strHost.toLowerCase() == "page")
			this.portalPageUpdate();

		// clear the FYEO data
		this.clearFYEO();
		if (trMessage) this.portalObj.setMessage(trMessage);
		this.formWnd.formState.tranAtEnd=true;
		this.txnHK=this.buildHK(false);
	}
	return true;
}

//-----------------------------------------------------------------------------
Magic.prototype.processError=function()
{
	// if the error is already processed return
	var errMsgNbr = this.getElement("MsgNbr")
	var errMsg = this.getElement("Message")
	var errFld = this.getElement("FldNbr")
	var UIDocument = this.formWnd.document

	if (errFld == "" || errMsgNbr=="000")
		return;

	var rowIdx = errFld.indexOf("r")
	var rowNbr = 0
	if (rowIdx != -1)
		rowNbr = errFld.substr(rowIdx)

	// Check to see if it is a hidden field and has a field btn
	var fldBtn = ""
	var fieldInfo = this.formWnd.namColl.getItem(errFld.replace(/r\d+/, "r0"))
	if (fieldInfo)
		fldBtn = fieldInfo.fldbtn
	if (fldBtn && fldBtn != "")
	{
		var htmElm = UIDocument.getElementById(fldBtn)
		if (!htmElm && rowIdx != -1)
			htmElm = UIDocument.getElementById(fldBtn+rowNbr)
		if (!htmElm)
		{ // In IE, if the tab is not painted yet...
			if(rowIdx != -1)
			{
				htmElm = this.portalWnd.frmFieldIntoView(this.formWnd, fldBtn+"r0") // This will switch tab
				htmElm = UIDocument.getElementById(fldBtn+rowNbr); // And this will be the actual field.
			}
			else
				htmElm = this.portalWnd.frmFieldIntoView(this.formWnd, fldBtn);
		}
		if (htmElm)
		{
			if (rowIdx != -1)
				this.portalWnd.frmSetActiveRow(this.formWnd, htmElm)
			this.formWnd.lawForm.positionInField(htmElm.id)
			// push to the token
			if (this.portalWnd.oBrowser.isIE)
				htmElm.fireEvent("onclick")
			else
				htmElm.click()
		}
	}
	else
	{
		// highlight error field and bring up the drill select if necessary
		this.portalWnd.frmHighlightErrorField(this.formWnd, errFld)
	}
	if (errMsg)
		this.portalObj.setMessage(errMsg);
}

//-----------------------------------------------------------------------------
Magic.prototype.magicCRTIO=function()
{
	this.formWnd.formState.crtio.setValue("customId", "")
	var elName="Request"
	this.formWnd.formState.crtio.setValue(elName, this.getElement(elName))
	elName="Screen"
	this.formWnd.formState.crtio.setValue(elName, this.getElement(elName))
	elName="DspXlt"
	this.formWnd.formState.crtio.setValue(elName, this.getElement(elName))
	elName="PassXlt"
	this.formWnd.formState.crtio.setValue(elName, this.getElement(elName))
	elName="Message"
	this.formWnd.formState.crtio.setValue(elName, this.getElement(elName))

	try {
		// is there custom script for pre-CRTIO 'data exchange'?
		if (typeof(this.formWnd.FORM_OnBeforeDataExchange) == "function")
		{
			var oCrtio=this.formWnd.FORM_OnBeforeDataExchange(this.formWnd.formState.crtio)
			if (!oCrtio)
			{
				this.formWnd.formState.crtio=new CRTIODataObj()
				return (false);
			}
			this.formWnd.formState.crtio=oCrito
		}
	} catch (e) { }

	var bRetVal=false;
	switch(this.formWnd.formState.crtio.Request)
	{
	case "MANUALCFKEY":
		var strFormType = this.getElement("FORMTYPE")
		if (!strFormType || strFormType == "window")
		{
			this.formWnd.formState.setValue("doPush", true)
            this.formWnd.formState.setValue("pushFromRow", false)
			this.txnHK=this.buildHK(false);
			this.formWnd.lawformPushWindow( frmBuildXpressCall(
					this.formWnd.formState.crtio.Screen, this.formWnd.strPDL, "modal",
					null, this.formWnd.formState.crtio.customId,null,null,this.formWnd.strHost) )
		}
		else
		{
			this.formWnd.formState.setValue("doTransfer", true);
			this.formWnd.keyColl.buildKeyBuffer()
			if (this.formWnd.strHost!="page")
			{
				if (typeof(this.formWnd.src)!="undefined")
					this.portalObj.backURL=this.formWnd.src;
				else
					this.portalObj.backURL=this.formWnd.location.href;
			}
			formTransfer(this.formWnd.formState.crtio.Screen, this.formWnd.strPDL,
				this.formWnd, "", this.formWnd.formState.crtio.customId, this.formWnd.strHost)
		}
		bRetVal=true;
		break;
	case "RETURNKNS":
		if (!this.formWnd.parent.formState)
			return false;
		// fall through
	case "RTNKNS_MANCF":
	case "EXITWINDOW":
	case "EXECCALLER":
		this.formWnd.lawformPopWindow()
		bRetVal=true;
		break;
	case "GENSCREEN":
		//810 TESLA returns this CRTIO screen for BATCH 'S','R','J' and 'M' transactions
		this.doBatchPushTransaction()
		return true;
	}
	return bRetVal;
}
//-----------------------------------------------------------------------------
Magic.prototype.doBatchPushTransaction=function()
{
	var strTKN = this.formWnd.strTKN;
	var usrName = this.getFieldValue(this.formWnd.strUsrNameFld);
	var jobName = this.getFieldValue(this.formWnd.strJobNameFld);

	switch(this.formWnd.formState.crtio.Screen)
	{
		case "UNJS.1": //Job Scheduler
			this.portalWnd.switchContents(this.portalWnd.getGoJobScheduleURL(usrName));
			break;
		case "UNPM.1": //Print Manager
			this.portalWnd.switchContents(this.portalWnd.getGoPrintFilesURL(usrName));
			break;
		case "@URS.1": //Job Submit
			if (!this.portalWnd.oBrowser.isIE)
				this.formWnd.formUnload();
 
 			this.portalWnd.showJobSubmit(jobName,usrName,window,"lawformRestoreCallback")
 			this.setElement("Message", this.portalObj.getMessage())
			break;
		case "@URS.2": //Report
			if (!this.portalWnd.oBrowser.isIE)
				this.formWnd.formUnload();

	 		this.portalWnd.showPrintMgr(jobName,usrName,strTKN,this.formWnd.lawForm,window,"lawformRestoreCallback")
	 		this.setElement("Message", this.portalObj.getMessage())
			break;
	}
}
//-----------------------------------------------------------------------------
Magic.prototype.setUIData=function()
{
	var htmElements = this.formWnd.document.getElementsByTagName("*");
	var len = htmElements.length;

	for (var i=0; i < len; i++)
	{
		try {
			var fldId = htmElements[i].id;
			if (fldId)
			{
				if (fldId.indexOf("_f") != 0 || !htmElements[i].getAttribute("nm")) //do not include unbound elements LSF-1525
					continue;
				this.checkSecuredfields(fldId)
				var strValue = this.getElement(fldId);
				this.setFieldValue(htmElements[i], strValue);
			}
		} catch (e) { }
	}
}

//-----------------------------------------------------------------------------
Magic.prototype.getUIData=function()
{
	var htmElements = this.formWnd.document.getElementsByTagName("*");
	var i, len = htmElements.length;
	var fldId, strValue;
	var currentArea=""
	var detailArea=""
	var tabRegion=""
	currentArea=this.formWnd.formState.currentDetailArea;
	if(currentArea)
	{
		detailArea=this.formWnd.document.getElementById(currentArea);
		tabRegion=detailArea.getAttribute("tabregion");
	}
	for (i=0; i<len; i++)
	{
		fldId = htmElements[i].id;
		if (fldId)
		{
			if (fldId.indexOf("_f") != 0)
				continue;
			if(tabRegion != "")
			{
				if (fldId.indexOf("r") > 0)
				{
					// Do not get the data from tabs that is subordinate to the detail
					// area. Those are already taken care of.
					
					//PT 182857 - also. include all hidden fields that are part of the detail
					// hidden fields don't have a par attribute, must check parent id if it contains "TF"
					var parent = htmElements[i].getAttribute("par")
					var parentNode = htmElements[i].parentNode
					if((parent && parent.indexOf("TF") >= 0) || (!parent && htmElements[i].type == "hidden" && parentNode.id.indexOf("TF") >= 0))
						continue;
				}
			}
			strValue = this.getFieldValue(htmElements[i]);
			this.setElement(fldId, strValue);
		}
	}

	if(this.FYEO)
	{
		// Iterate the hidden map and clear the elements that are not visited
		var hmap = this.formWnd.hiddenMap.hm;
		var fldId;
		for (fldId in hmap)
		{

			var fieldInfo = this.formWnd.namColl.getItem(fldId)

			if(!fieldInfo || !fieldInfo.fldbtn)
				continue;

			var bDetailFld = (fieldInfo.det.length == 0 ? false : true)
			if (bDetailFld)
			{
				var oDetail = this.formWnd.detailColl.getItem(fieldInfo.det);
				var loop = oDetail.rows;

				for (var i = 0; i < loop; i++)
				{
						var fldId1 = fldId.replace(/r\d+/, "r" + i);
						this.clearFieldElementFYEO(fldId1, fieldInfo.fldbtn);

				}
			}
			else
			{
				this.clearFieldElementFYEO(fldId, fieldInfo.fldbtn);
			}
		}
	}
}

//-----------------------------------------------------------------------------
Magic.prototype.getFieldValue=function(fld,noEmpty)
{
	var htmElm=null;
	if(typeof(fld)=="string")
		htmElm = this.formWnd.document.getElementById(fld)
	else if(typeof(fld)=="object")
		htmElm = fld

	if (htmElm)
	{
		if (htmElm.nodeName == "INPUT" || htmElm.nodeName == "TEXTAREA") //include text area here.
		{
			// if field is a select field, then take the tran val to the database
			if (htmElm.getAttribute("tp") == "select" || htmElm.getAttribute("tp") == "fc")
			{
				var htmElmVals = this.formWnd.document.getElementById("VALUES"+htmElm.id)
				if(htmElmVals)
				{
					var loop = htmElmVals.childNodes.length;
					for (var k=0; k<loop; k++)
					{
						var oElmValNode = htmElmVals.childNodes[k];

						if(oElmValNode.nodeType != 1)
							continue;

						if (htmElm.value == oElmValNode.getAttribute("disp"))
							return oElmValNode.getAttribute("tran")
					}
				}
				return htmElm.value
			}
			else if (htmElm.type=="checkbox")
			{
				var htmElmVals = this.formWnd.document.getElementById("VALUES"+htmElm.id)
				if (htmElmVals)
				{
					var ch=(htmElm.checked ? "1" : "0");
					// default wants only if checked - sets noEmpty to true
					if (!noEmpty || ch=="1")
					{
						var loop = htmElmVals.childNodes.length;
						for (var k=0; k < loop; k++)
						{
							if (ch == htmElmVals.childNodes[k].checked)
								return htmElmVals.childNodes[k].getAttribute("tran")
						}
					}
				}
			}
			else if (htmElm.type=="radio")
			{
				arrElm=this.formWnd.document.getElementsByName(htmElm.id)
				var len=(arrElm?arrElm.length:null)
				for (var i=0;i<len;i++)
				{
					if (arrElm[i].checked)
						return arrElm[i].getAttribute("tran")
				}
			}
			else
				return htmElm.value
		}
		else
		{
			if (!htmElm.hasChildNodes())
				return "";
			var txtNode=htmElm.childNodes[0];
			if (htmElm.nodeName == "LABEL" && htmElm.title.indexOf("\t") > -1)
			{
				return htmElm.title;
			}
			return (txtNode.nodeType!=3 && txtNode.nodeType!=4
				? ""
				: txtNode.nodeValue.replace(/\xA0/g," "));
		}
	}
	else if(this.FYEO)
	{
		// If FYEO, check to see if the element value needs to be cleared if it is a hidden in a pushed form
		// Here fld param is a field number
		var fieldInfo = this.formWnd.namColl.getItem(fld)
		if(fieldInfo && fieldInfo.fldbtn != "" && fieldInfo.type.toLowerCase() == "hidden")
			this.clearFieldElementFYEO(fld, fieldInfo.fldbtn)
		return "NOELM"
	}
	return "NOELM"
}

//-----------------------------------------------------------------------------
Magic.prototype.setFieldValue=function(fld, value)
{
	var htmElm=null
	if (typeof(fld) == "string")
		htmElm = this.formWnd.document.getElementById(fld)
	else if (typeof(fld) == "object")
		htmElm = fld

	if (!htmElm) return false;

	if (htmElm.nodeName == "INPUT" || htmElm.nodeName == "TEXTAREA")
	{
		if(htmElm.getAttribute("tp") == "select")
		{
			var htmElmVals = this.formWnd.document.getElementById("VALUES"+htmElm.id)
			if(htmElmVals)
			{
				var loop = htmElmVals.childNodes.length;

				for (var k=0; k<loop; k++)
				{
					var oElmValNode = htmElmVals.childNodes[k];

					if(oElmValNode.nodeType != 1)
						continue;

					var tran=null
					if(!isNaN(oElmValNode.getAttribute("tran")))	//check if tran is a number
					{
						if (parseFloat(oElmValNode.getAttribute("tran")) &&	//remove trailing zeros
							parseFloat(value))
						{
							tran = parseFloat(oElmValNode.getAttribute("tran"));
							value = parseFloat(value);
						}
						else if(parseInt(oElmValNode.getAttribute("tran")) &&	//remove leading zeros	
								parseInt(value))
						{
							tran = parseInt(oElmValNode.getAttribute("tran"));
							value = parseInt(value);
						}
						else
							tran = oElmValNode.getAttribute("tran");
					}
					else
						tran = oElmValNode.getAttribute("tran");

					if( value == tran )
					{
						value = oElmValNode.getAttribute("disp");
						break;
					}
				}
			}
			htmElm.value=value
			var xlt=htmElm.getAttribute("xltis");
			if (xlt)
			{
				if(htmElm.id.split("r")[1])
					xlt = xlt.replace(/r\d+$/,"r"+htmElm.id.split("r")[1])
				if(htmElm.value != "")
					strTranslation = oElmValNode.getAttribute("text") + xlt;
			}	
		}
		else if (htmElm.type=="checkbox")
		{
			var htmElmVals = this.formWnd.document.getElementById("VALUES"+htmElm.id)
			if(htmElmVals)
			{
				var loop = htmElmVals.childNodes.length;
				for (var k=0; k<loop; k++)
				{
					if(value == htmElmVals.childNodes[k].tran)
					{
						htmElm.checked=(htmElmVals.childNodes[k].checked=="1")
						break
					}
				}
			}
		}
		else if (htmElm.type=="radio")
		{
			arrElm=this.formWnd.document.getElementsByName(htmElm.id)
			var len=(arrElm?arrElm.length:null)
			for (var i=0;i<len;i++)
				arrElm[i].checked=(arrElm[i].tran==value)
		}
		else
			htmElm.value=value
	}
	else if (htmElm.nodeName == "BUTTON")
	{
		value=this.portalWnd.trim(value);
		htmElm.innerHTML=this.portalWnd.xmlEncodeString(value);
		// the following is handled in IE by an 'onpropertychange' event
		if (!this.portalObj.xsltSupport)
			this.formWnd.lawformButtonUpdate(htmElm);
	}
	else if (htmElm.nodeName == "LABEL" && this.portalWnd.oBrowser.isIE)
	{
		htmElm.innerText=value
		if (htmElm.getAttribute("tp") == "out")
		{
			htmElm.setAttribute("title", value)
			if(strTranslation)
			{
				var transIndex = strTranslation.lastIndexOf("_");
				var xlt = strTranslation.slice(transIndex);
				var transValue = strTranslation.slice(0,transIndex);
				if((transValue != "null") && (xlt == htmElm.id ))
				{
					htmElm.innerText = transValue;
					strTranslation = null;
				}	
			}
		}
	}
	else
	{
		if(htmElm.hasChildNodes())
		{
			var txtNode=htmElm.childNodes[0];
			if(txtNode.nodeType==3 || txtNode.nodeType==4)
				txtNode.nodeValue=value
			else
				htmElm.appendChild(this.formWnd.document.createTextNode(value))
		}
		else
			htmElm.appendChild(this.formWnd.document.createTextNode(value))

		if (htmElm.nodeName=="LABEL" && htmElm.getAttribute("tp")=="out")
			htmElm.setAttribute("title", value)
	}
	return true
}

//-----------------------------------------------------------------------------
Magic.prototype.processFYEO=function()
{
	// check the function code and return if not add (Consider add, chg+ladd combination)
	var chglAdd = false;
	var fcadd = this.formWnd.frmElement.getAttribute("add");
	if (!fcadd || fcadd=="") return;

	// if not an add transaction
	if (fcadd.indexOf(this.FC) < 0)
	{
		if (this.formWnd.frmElement.getAttribute("chg")
		&& this.formWnd.frmElement.getAttribute("chg").indexOf(this.FC) >= 0)
		{
			if (!this.formWnd.frmElement.getAttribute("ladd")) return 
			chglAdd = true 
		}
		else 
			return;
	}

	// build the visited push screen string
	var pushElems = this.formWnd.pushColl
	var rowFC=""
	var rowIdx=""
	var pushBtn=null
	var hkey = this.buildHK(false);
	var loop = pushElems.length;
	for (var i=0; i < loop; i++)
	{
		pushBtn = this.formWnd.document.getElementById(pushElems.children(i).fld);
		if (!pushBtn)
		{
			// include hidden fldbtn data for push elements in unrendered tabs
			this.visitedPushScr += pushElems.children(i).fld + "~";
			continue;
		}
		rowIdx = pushBtn.id.indexOf("r");
		if (rowIdx >= 0)
		{
			var dtlArea = this.formWnd.document.getElementById(pushBtn.getAttribute("det"));
			if (!dtlArea) continue;
			var dtlRows = parseInt(dtlArea.getAttribute("rows"),10);
			for (var j=0; j < dtlRows; j++)
			{
				var row = pushBtn.getAttribute("par") && pushBtn.getAttribute("par").indexOf("TF") >= 0 ? 0 : j
				var rowBtn = this.formWnd.document.getElementById(pushBtn.id.replace(/r\d+/, "r"+row))
				if (!rowBtn) continue;

				if (chglAdd)
				{
			        if (this.formWnd.strRowFCFldNbr)
					{
				        rowFC = this.formWnd.document.getElementById(
				        		this.formWnd.strRowFCFldNbr.replace(/r\d+/, "r"+j)).value;
					}

					// if line FC = 'A' then check if push is visited. If it 
					// is not 'A' just add it to the visited list so that the 
					// value is retained in those rows
					if ( (rowFC == this.formWnd.frmElement.getAttribute("ladd")
						&& rowBtn.getAttribute("visited") 
						&& rowBtn.getAttribute("visited").indexOf("~" + j + "~") >= 0)
					|| rowFC != this.formWnd.frmElement.getAttribute("ladd") )
						this.visitedPushScr += rowBtn.id.replace(/r\d+/, "r" + j + "~")
				}
				else
				{
					// form FC = 'A' so check if push is visited
					if (rowBtn.getAttribute("visited")
					&& rowBtn.getAttribute("visited").indexOf("~" + j + "~") >= 0)
					{
						if (rowBtn.getAttribute("hkey") != null
						&& rowBtn.getAttribute("hkey") == hkey)
							this.visitedPushScr += rowBtn.id.replace(/r\d+/, "r" + j + "~")
					}
				}
			}
		}
		else if (chglAdd && rowIdx == -1)
			this.visitedPushScr += pushBtn.id + "~"
		else if (pushBtn.getAttribute("visited") && pushBtn.getAttribute("visited") == "1")
		{
			if (pushBtn.getAttribute("hkey") != null
			&& pushBtn.getAttribute("hkey") == hkey)
				this.visitedPushScr += pushBtn.id + "~"
		}
	}
	this.FYEO=true
	return;
}

//-----------------------------------------------------------------------------
Magic.prototype.clearFieldElementFYEO=function(fld, fldbtn)
{
	if(fld.indexOf("r") >= 0)
		fldbtn = fldbtn+fld.substr(fld.indexOf("r"))+"~";

	if(this.visitedPushScr.indexOf(fldbtn) < 0)
		this.setElement(fld, "")
}

//-----------------------------------------------------------------------------
Magic.prototype.clearFYEO=function()
{
	var pushElems = this.formWnd.pushColl;
	var len = pushElems.length;
	for (var i=0; i < len; i++)
	{
		var pushBtn = this.formWnd.document.getElementById(pushElems.children(i).fld);
		if (!pushBtn) continue;
		if (pushBtn.id.indexOf("r") < 0)
		{ 
			pushBtn.setAttribute("visited", "");
			pushBtn.setAttribute("hkey", "");
		}
		else
		{
			var dtlArea = this.formWnd.document.getElementById(pushBtn.getAttribute("det"));
			if (!dtlArea) continue;
			var dtlRows = parseInt(dtlArea.getAttribute("rows"),10);
			dtlRows = pushBtn.getAttribute("par") && pushBtn.getAttribute("par").indexOf("TF") >= 0 ? 1 : dtlRows;
			for (var row=0; row<dtlRows; row++)
			{
				var rowBtn = this.formWnd.document.getElementById(pushBtn.id.replace(/r\d+/, "r"+row));
				if (!rowBtn) continue;
				rowBtn.setAttribute("visited", "");
				rowBtn.setAttribute("hkey", "");
			}
		}
	}
	this.visitedPushScr = "";
	this.FYEO=false;
}

//-----------------------------------------------------------------------------
Magic.prototype.setTabSecurity=function(tabReg, bDtlSubTab)
{
	var bTop = (typeof(tabReg)=="undefined" ? true : false);
	tabReg = (typeof(tabReg)=="undefined" ? "TR0" : tabReg);
	bDtlSubTab = (typeof(bDtlSubTab)=="undefined" ? false : bDtlSubTab);

	// get the tabregion element
	var regElem = this.formWnd.document.getElementById(tabReg)
	if (!regElem) return;

	if (regElem.getAttribute("name").indexOf("DT") >= 0 && bTop)
		bDtlSubTab=true;

	var activeTab="";

	var len = regElem.childNodes.length;
	for (var i=0; i < len; i++)
	{
		// for each tab pane element
		var trChild=regElem.childNodes[i];
		if (trChild.nodeName=="#comment" || trChild.nodeName=="#text"
		|| typeof(trChild.id) == "undefined")
			continue;
		if (trChild.id.indexOf("PANE") < 0)
			continue;

		// get the tab number
		var tabnbr = trChild.id.substr(0,trChild.id.indexOf("PANE"));
		var nbr = trChild.getAttribute("fld");
		if (!nbr || nbr == "")
			continue;	// custom forms may not have a nbr attribute
		if (bDtlSubTab)
			nbr += "r"+this.formWnd.formState.currentRow;
		var value = this.getElement(nbr);
		var tabNode = this.getElementNode(nbr);
		var name = value.substr(0, value.length-1);

		// application specified state: 0=inactive,1=disabled,2=active
		// returned as last character of text ..good design ;-)
		var state = value.substr(value.length-1);
		if (state =="1")
			// not sure why this shouldn't just be 'this.storage'?
			this.formWnd.lawForm.magic.storage.setElementValue(nbr,state);
		if (state == "2")
			activeTab = tabnbr;

		// if LS security is on we never get 'data' for the tab (so
		// state is blank, as is name).  We don't want this next check
		// before the check of state=1 above because we don't want to
		// send the data back on the next transaction.
		if (state == "")
		{
			state = ((tabNode && tabNode.getAttribute("secured"))
				? "1" : "");
		}
		if (state != "")
			this.formWnd.lawForm.setTabState(tabnbr, state);
		if (name != "" && !this.formWnd.strFORMID)
			this.formWnd.lawForm.changeTabName(tabnbr, name);
	}

	// have we found an active tab?
	if (activeTab == "")
	{
		activeTab=regElem.getAttribute("curtab");
		var currentPane = this.formWnd.document.getElementById(activeTab + "PANE");
		if (!currentPane) return;

		var nbr=currentPane.getAttribute("fld");
		var isProtected = (!nbr || nbr == "" ? "" : this.getElement(nbr));
		isProtected = isProtected.substr(isProtected.length-1);

		if (isProtected!="1")
			this.formWnd.lawForm.setTabState(activeTab, "2");
		else
		{
			// set the active tab to the first inactive tab found
			len = regElem.childNodes.length;
			for (var i=0; i < len; i++)
			{
				trChild=regElem.childNodes[i];
				if (trChild.nodeName=="#comment" || trChild.nodeName=="#text"
				|| typeof(trChild.id) == "undefined")
					continue;
				if (trChild.id.indexOf("PANE") < 0)
					continue;

				tabnbr = trChild.id.substr(0, trChild.id.indexOf("PANE"));
				nbr = trChild.getAttribute("fld");
				if (!nbr || nbr == "")
					continue;	// custom forms may not have a nbr attribute
				if (bDtlSubTab)
					nbr += "r"+this.formWnd.formState.currentRow;
				value = this.getElement(nbr);
				value = value.substr(value.length-1);
				if (value == "0")
				{
					this.formWnd.lawForm.setTabState(tabnbr, "2");
					activeTab=tabnbr;
					break;
				}
			}
		}
	}

	// apply tab security to detail subordinate tabs
	var pane = this.formWnd.document.getElementById(activeTab + "PANE");
	if (!pane) return;
	if (pane.getAttribute("hasdtl") != "")
	{
		var da = this.formWnd.document.getElementById(pane.getAttribute("hasdtl"))
		if (da && da.getAttribute("tabregion") != "")
			this.setTabSecurity(da.getAttribute("tabregion"), true)
	}
	else if (pane.getAttribute("hastab") != "")
		this.setTabSecurity(pane.getAttribute("hastab"), false)
}

//-----------------------------------------------------------------------------
Magic.prototype.portalPageRefresh=function(pStorage, bRefresh)
{
	var lfn = ""
	var fld = ""
	var val = ""
	if (!this.formWnd.parent.page) return;
	if (typeof(pStorage) == "undefined")
		pStorage = this.formWnd.parent.page.dataSource;
	if (typeof(bRefresh) == "undefined")
		bRefresh = false;
	var len = this.formWnd.reqColl.length;
	for (var i=0; i < len; i++)
	{
		if (this.formWnd.reqColl.children(i).key != "1")
			continue;
		fld = this.formWnd.reqColl.children(i).fld
		lfn = this.formWnd.namColl.getItem(fld).nm
		if (lfn == "") continue;

		val = pStorage[lfn]
		if(val)
		{
			this.setElement(fld, val)
			this.setFormData(fld)
		}
	}
	var strHK = this.buildHK()
	if (strHK != "")
	{
		if (bRefresh || strHK != this.HK)
		{
			this.HK=strHK;
			this.transact("I", true);
			return true;
		}
	}
	return false;
}

//-----------------------------------------------------------------------------
Magic.prototype.portalPageUpdate=function()
{
	if(this.formWnd.name != "" && this.formWnd.parent.page)
	{
		var objFormlet = this.formWnd.parent.page.objects[this.formWnd.name];
		if (!objFormlet) return;
		if (objFormlet.frmTKN != this.formWnd.strTKN)
			return;

		var dataStore = this.formWnd.parent.page.getObjectValues(this.formWnd.name);
		var nm, nmItem;
		for(nm in dataStore)
		{
			if(typeof(dataStore[nm]) != "function")
			{
				nmItem = this.formWnd.namColl.getNameItem(nm);
				if(!nmItem)continue;
				dataStore[nm] = this.getElement(nmItem.fld);
				if(!dataStore[nm])dataStore[nm] = "";
			}
		}
		this.formWnd.parent.page.setObjectValues(this.formWnd.name, dataStore);
	}
}

//-----------------------------------------------------------------------------
Magic.prototype.isKeycheckFc=function(FC)
{
	if(typeof(FC) == "undefined")
		FC = this.FC;

	var keycheckFcs = this.formWnd.frmElement.getAttribute("keycheck");
	return this.portalWnd.cmnIsValueInString(FC, keycheckFcs);
}
//-----------------------------------------------------------------------------
Magic.prototype.isDataReqFc=function(FC)
{
	if(typeof(FC) == "undefined")
		FC = this.FC;

	var dataReqFcs = this.formWnd.frmElement.getAttribute("datareq");
	return this.portalWnd.cmnIsValueInString(FC, dataReqFcs);
}
//-----------------------------------------------------------------------------
Magic.prototype.isLineDataReqFc=function(FC)
{
	var ldataReqFcs = this.formWnd.frmElement.getAttribute("ldatareq");
	return this.portalWnd.cmnIsValueInString(FC, ldataReqFcs);
}
//-----------------------------------------------------------------------------
Magic.prototype.isNextFc=function(FC)
{
	if(typeof(FC) == "undefined")
		FC = this.FC;

	var nextFcs = this.formWnd.frmElement.getAttribute("next");
	return this.portalWnd.cmnIsValueInString(FC, nextFcs);
}
//-----------------------------------------------------------------------------
Magic.prototype.keyMatch=function()
{
	var hk1 = this.buildHK(false);
	return (hk1 == this.txnHK ? true : false);
}
//-----------------------------------------------------------------------------
Magic.prototype.isKeyOnlyFc=function(FC)
{
	if(typeof(FC) == "undefined")
		FC = this.FC;

	var inqFcs = this.formWnd.frmElement.getAttribute("inq");
	var delFcs = this.formWnd.frmElement.getAttribute("del");
	var nextFcs = this.formWnd.frmElement.getAttribute("next");

	if(this.portalWnd.cmnIsValueInString(FC, inqFcs))
		return true;

	if(this.portalWnd.cmnIsValueInString(FC, delFcs))
		return true;

	if(this.portalWnd.cmnIsValueInString(FC, nextFcs))
		return true;

	return false;
}
//-----------------------------------------------------------------------------
Magic.prototype.createTransactionPackage=function()
{
	var oTransactionDS = new this.portalWnd.DataStorage(this.strTranXML);
	var delimeter = String.fromCharCode(9);
	var criteriaAry = new Array();
	var criteriaIndex = 0;
	var criteriaStr = "";
	var transactionAry = new Array();
	var transactionIndex = 0;
	var transactionStr = "";
	var oFormWnd = this.formWnd;
	var fcFld = oFormWnd.strFrmFCFldNbr;
	var hkFld = oFormWnd.strHKFldNbr;
	var bKeycheckFc = this.isKeycheckFc();
	var bIgnoreRequired = (this.storage.getElementValue("_IGNREQD") == "1" ? true : false)
	var oFormNode = this.storage.getNodeByName(this.formWnd.strTKN);
	var loop = oFormNode.childNodes.length;

	for (var i=0; i < loop; i++)
	{
		var oNode = oFormNode.childNodes[i];
		if (oNode.nodeType == 3 || oNode.nodeType == 4) 
			continue;

		var nodeName = oNode.nodeName;
		var oElementRE = new RegExp(/_f\d/g);
		var oCriteriaRE = new RegExp(/_PDL|_TKN|_CACHE|_OUT|_TRANSID|_DATEFMT/g);
		var bIsElement = oElementRE.test(nodeName);
		var	bFCFld = (fcFld == nodeName ? true : false);
		var bHKFld  = (hkFld == nodeName ? true : false);
		var nodeValue = this.storage.getElementValue(nodeName);
		var bBlank = (nodeValue.length == 0 ? true : false);

		if (bIsElement)
		{
			if (bBlank && !bIgnoreRequired)
			{
				var bRequired = this.isRequiredElement(nodeName);
				if ((bRequired || bFCFld) && !bHKFld)
				{
					var msg = this.portalObj.getPhrase("FIELDREQUIRED");
					this.setElement("MsgNbr", "100");
					this.setElement("Message", msg);
					this.setElement("FldNbr", nodeName);
					this.processError();
					return null;
				}
			}
			// must check for secured attribute
			var sec = oNode.getAttribute("secured");
			if (sec)
			{
				transactionAry[transactionIndex] = nodeName.substr(2) + "s=" + sec;
				transactionIndex++;
			}
			else if (!bBlank || (bBlank && this.oldTxn != null && this.oldTxn.getElementValue(nodeName) != ""))
			{
				transactionAry[transactionIndex] = nodeName.substr(2) + "=" + nodeValue;
				transactionIndex++;
			}
		}
		else
		{
			if (oCriteriaRE.test(nodeName))
			{
				criteriaAry[criteriaIndex] = nodeName + "=" + nodeValue;
				criteriaIndex++;
			}
		}
	}

	criteriaAry[criteriaIndex] = "TFN=TRUE";
	criteriaStr = criteriaAry.join(delimeter);
	transactionStr = transactionAry.join(delimeter);

	var oCriteriaNode = oTransactionDS.getNodeByName("CRITERIA");
	oCriteriaNode.appendChild(oTransactionDS.document.createCDATASection(criteriaStr));
	var oTranNode = oTransactionDS.getNodeByName("TRAN");
	oTranNode.appendChild(oTransactionDS.document.createCDATASection(transactionStr));

	return oTransactionDS;
}

//-----------------------------------------------------------------------------
Magic.prototype.isRequiredElement=function(fld)
{
	var oformWnd = this.formWnd;
	var itemId = fld.replace(/r\d+/,"r0");
	var reqFld = oformWnd.reqColl.getItem(itemId);

	if (!reqFld  || reqFld.req != "1")
		return false;

	var nameFld = nameFld = oformWnd.namColl.getItem(itemId);
	if (nameFld.type == "Output" || nameFld.type == "Hidden")
		return false;

	if (!this.formWnd.lawForm.isBatchForm)
	{
		if (reqFld.det.length == 0)
		{
			if (this.isNextFc() && reqFld.nextreq != "1")
				return false;
			if (reqFld.key == "1" || this.isDataReqFc())
				return true;
			return false;
		}

		var line = fld.substring(fld.indexOf("r"));
		var lfcItem = oformWnd.strRowFCFldNbr;
		var lfcFld = oformWnd.namColl.getItem(lfcItem);

		if (lfcItem.length != 0 && lfcFld.type == "Fc")
		{
			var lfcId = lfcItem.replace(/r\d+/,line);
			var lfcValue = this.storage.getElementValue(lfcId);

			if (lfcValue.length != 0)
			{
				if(reqFld.key == "1" || this.isLineDataReqFc(lfcValue))
					return true;
			}
			return false;
		}
		if (this.isDataReqFc())
		{
			this.setDetailLineFlds(reqFld.det);

			if(this.isDetailEntered(reqFld.det, line))
				return true;
		}
		return false;
	}
	else
	{
		if (this.isNextFc() && reqFld.keynbr != "@un")
			return false;
		if (reqFld.keynbr == "@un" || reqFld.keynbr == "@jn" )
			return true;
		return false;
	}
	return false;
}
//-----------------------------------------------------------------------------
Magic.prototype.setDetailLineFlds=function(detailId)
{
	if (typeof(detailId) != "string")
		return false;

	var detFlds = this.getDetailLineFlds(detailId);
	if (detFlds) return true;

	var fldsAry = new Array();
	var index = 0;
	var oformWnd = this.formWnd;
	var loop = oformWnd.namColl.length;

	for (var i = 0; i < loop; i++)
	{
		var nameFld = oformWnd.namColl.children(i);
		if (nameFld.det == detailId)
		{
			var tempObj = new Object();
			tempObj.fld = nameFld.fld;
			tempObj.type = nameFld.type;
			fldsAry[index] = tempObj;
			index++;
		}
	}
	this.detailLineFlds[detailId] = fldsAry;
	return true;
}
//-----------------------------------------------------------------------------
Magic.prototype.getDetailLineFlds=function(detailId)
{
	return this.detailLineFlds[detailId];
}
//-----------------------------------------------------------------------------
Magic.prototype.isDetailEntered=function(detailId, line)
{
	var fldAry = this.getDetailLineFlds(detailId);
	if (!fldAry) return false;

	var len = fldAry.length;
	for (var i = 0; i < len; i++)
	{
		var detfld = fldAry[i];
		var detFdId = detfld.fld.replace(/r\d+/,line);
		var value = this.storage.getElementValue(detFdId);
		var bBlank = (value.length == 0 ? true : false);
		var detFdType = detfld.type.toUpperCase();

		if (!bBlank && (detFdType == "SELECT" || detFdType == "TEXT"))
			return true;
	}
	return false;
}
//-----------------------------------------------------------------------------
Magic.prototype.isNeededElement=function(fld)
{
	var oformWnd = this.formWnd;
	var itemId = fld.replace(/r\d+/,"r0");
	var reqFld = oformWnd.reqColl.getItem(itemId);

	if (!reqFld) return false;
	if (reqFld.key == "1") return true;

	if ( this.formWnd.lawForm.isBatchForm 
	&& (reqFld.keynbr == "@un" || reqFld.keynbr == "@jn" ) )
		return true;

	return false;
}
//-----------------------------------------------------------------------------
Magic.prototype.triggerWorkflow=function(FC)
{
	if (typeof(FC) != "string") return;

	var oWorkflow = this.formWnd.workflows.getItem(FC);
	if (!oWorkflow) return;

	var len = oWorkflow.businessCriterias.length;
	for (var i=0; i < len; i++)
		oWorkflow.businessCriterias[i].runtimeValue = 
			this.getWorkflowRuntimeValue(oWorkflow.businessCriterias[i].type, 
					oWorkflow.businessCriterias[i].value);

	len = oWorkflow.variables.length;
	for (var i=0; i < len; i++)
		oWorkflow.variables[i].runtimeValue = 
			this.getWorkflowRuntimeValue(oWorkflow.variables[i].type, 
					oWorkflow.variables[i].value);

	var wfUser = this.portalWnd.oUserProfile.getId();
	var wfApi = oWorkflow.buildApi(wfUser, this.portalWnd);

	var wfResult = this.portalWnd.SSORequest("/bpm/xml/trigger.do","method=start&xmlDoc="+escape(wfApi),"text/plain","text/xml",false);
	this.portalWnd.oError.setMessage(this.portalObj.getPhrase("ERR_WORKFLOW_TRIGGER")+ "\n");
	
	if (this.portalWnd.oError.isErrorResponse(wfResult))
		return;

	var ds=this.portalWnd.oError.getDSObject();
	if (this.portalWnd.oBrowser.isIE)
	{
		this.lastWorkflowReq = wfApi;
		this.lastWorkflowRes = ds.document.xml;
	}
	else
	{
		var ser=new XMLSerializer();
		this.lastWorkflowReq = wfApi;
		this.lastWorkflowRes = ser.serializeToString(ds);
	}
}

//-----------------------------------------------------------------------------
Magic.prototype.getWorkflowRuntimeValue=function(type, value)
{
	switch (type)
	{
		case "Literal":
			return value;
			break;
		case "Field":
			var fldNbr = this.formWnd.namColl.getNameItem(value).fld;
			return this.storage.getElementValue(fldNbr);
			break;
		case "UserEnv":
			return this.portalWnd.oUserProfile.getAttribute(value);
			break;
	}

	return value;
}

//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
function Workflow(service, system, subSystem, categoryValue, trigger)
{
	if (typeof(service) != "string" 
	|| typeof(system) != "string"
	|| typeof(subSystem) != "string")
		return null;

	this.service = service;
	this.system = system;
	this.subSystem = subSystem;
	this.categoryValue = categoryValue;
	this.trigger = trigger;

	this.businessCriterias = new Array();
	this.variables = new Array();
	this.folders = new Array();
	this.businessCriteriasIndex = new Array();
	this.variablesIndex = new Array();
	this.foldersIndex = new Array();

	return this;
}
//-----------------------------------------------------------------------------
Workflow.prototype.addCriterion=function(name, type, value)
{
	if (typeof(name) != "string"
	|| typeof(type) != "string"
	|| typeof(value) != "string")
		return false;

	var i = this.businessCriterias.length;

	var oCriteria = new Object();
	oCriteria.name = name;
	oCriteria.type = type;
	oCriteria.value = value;
	oCriteria.runtimeValue = value;

	this.businessCriterias[i] = oCriteria;
	this.businessCriteriasIndex[name] = i;

	return true;
}
//-----------------------------------------------------------------------------
Workflow.prototype.addVariable=function(name, type, value)
{
	if (typeof(name) != "string"
	|| typeof(type) != "string"
	|| typeof(value) != "string")
		return false;

	var i = this.variables.length;

	var oVariable = new Object();
	oVariable.name = name;
	oVariable.type = type;
	oVariable.value = value;
	oVariable.runtimeValue = value;

	this.variables[i] = oVariable;
	this.variablesIndex[name] = i;

	return true;
}
//-----------------------------------------------------------------------------
Workflow.prototype.addFolder=function(name, type, keyString)
{
	if (typeof(name) != "string"
	|| typeof(type) != "string"
	|| typeof(keyString) != "string")
		return false;

	var i = this.folders.length;

	var oFolder = new Object();
	oFolder.name = name;
	oFolder.type = type;
	oFolder.keyString = keyString;

	this.folders[i] = oFolder;
	this.foldersIndex[name] = i;

	return true;
}
//-----------------------------------------------------------------------------
Workflow.prototype.buildApi=function(user, portalWnd)
{
	var timeStamp = new Date().getTime();
	var workTitle= "LP_" + this.service + "_" + user + "_" + timeStamp;
	var strAry = new Array();

	strAry[0] = "<?xml version=\"1.0\"?>"
	strAry[1] = "<bpm-trigger-input name=\"" + this.service + 
			"\" eventType=\"ServiceAsync\" function=\"initiate\">"
	strAry[2] = "<work-title>" + workTitle + "</work-title>"
	strAry[3] = "<product>" + this.system + "</product>"
	strAry[4] = "<data-area>" + this.subSystem + "</data-area>"
	strAry[5] = "<user>" + user + "</user>"
	strAry[6] = "<category-value>" + this.categoryValue + "</category-value>"
	strAry[7] = this.buildBusinessCriterias()
	strAry[8] = this.buildVariables()
	strAry[9] = this.buildFolders()
	strAry[10] = "</bpm-trigger-input>"

	var str = strAry.join("");
	return str;
}
//-----------------------------------------------------------------------------
Workflow.prototype.buildBusinessCriterias=function()
{
	var strAry = new Array();
	var len = this.businessCriterias.length;
	for (var i = 0; i < len; i++)
		strAry[i] = "<business-criteria>" + this.businessCriterias[i].runtimeValue + 
				"</business-criteria>";

	var str = "<business-criterias>" + strAry.join("") + "</business-criterias>";
	return str;
}
//-----------------------------------------------------------------------------
Workflow.prototype.buildVariables=function()
{
	var strAry = new Array();
	var len = this.variables.length;
	for (var i = 0; i < len; i++)
	{
		strAry[i] = "<variable>"
			+ "<name>" + this.variables[i].name + "</name>"
			+ "<value>" + this.variables[i].runtimeValue + "</value>"
			+ "</variable>"
	}

	var str = "<variables>" + strAry.join("") + "</variables>";
	return str;
}
//-----------------------------------------------------------------------------
Workflow.prototype.buildFolders=function()
{
	var strAry = new Array();
	var len = this.folders.length;
	for (var i = 0; i < len; i++)
	{
		strAry[i] = "<folder>"
			+ "<name>" + this.folders[i].name + "</name>"
			+ "<type>" + this.folders[i].type + "</type>"
			+ "<key-string>" + this.folders[i].keyString + "</keyString>"
	}

	var str = "<folders>" + strAry.join("") + "</folders>";
	return str;
}
//-----------------------------------------------------------------------------
function HiddenMap()
{
	this.hm = new Array();
}
//-----------------------------------------------------------------------------
HiddenMap.prototype.createHiddenMap=function(namColl)
{
	var i=0;
	var fldInfo = namColl.children(i);
	while (fldInfo)
	{
		if(fldInfo.type.toLowerCase() == "hidden")
			this.hm[fldInfo.fld] =  i;
		i++;
		fldInfo = namColl.children(i);
	}
}
//-----------------------------------------------------------------------------
HiddenMap.prototype.isHidden=function(fld)
{
	return (typeof(this.hm[fld]) != "undefined") ? true : false;
}

Magic.prototype.checkSecuredfields=function(fldId)
{
	var oFormNode = this.storage.getNodeByName(fldId);
	if(oFormNode)
	{
			var sec = oFormNode.getAttribute("secured");
			if (sec)
			{
				htmElm = this.formWnd.document.getElementById(fldId)
				htmElm.setAttribute("disabled",true)
			}
	}
}
