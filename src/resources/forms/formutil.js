/* $Header: /cvs/cvs_archive/LawsonPlatform/ui/portal/forms/formutil.js,v 1.98.2.25.4.63.6.25.2.7.2.4 2010/10/18 02:49:59 jomeli Exp $ */
/* $NoKeywords: $ */
/* LaVersion=8-)@(#)@9.0.1.6.433 2010-10-18 04:00:00 (201005) */
//-----------------------------------------------------------------------------
//	Proprietary Program Material
//	This material is proprietary to Lawson Software, and is not to be
//	reproduced or disclosed except in accordance with software contract
//	provisions, or upon written authorization from Lawson Software.
//
//	Copyright (C) 2000-2007 by Lawson Software. All Rights Reserved.
//	Saint Paul, Minnesota
//-----------------------------------------------------------------------------

var FORMSFORMUTILJS="forms/formutil.js";		// constant for error handling

//-----------------------------------------------------------------------------
function formTransfer(TKN, PDL, wind, hkey, id, host, isMenu, parMenu)
{
	if(!PDL)
		PDL=oUserProfile.getAttribute("productline",true,"persistUserPDL");
	if (!PDL || PDL=="")
	{
		if (!portalWnd.erpPhrases)
			portalWnd.erpPhrases=new portalWnd.phraseObj("forms")
		alert(portalWnd.erpPhrases.getPhrase("ERR_NO_PRODLINE"))
		return;
	}
	if (typeof(TKN) == "undefined" || TKN==null || TKN=="")
	{
		if (!portalWnd.erpPhrases)
			portalWnd.erpPhrases=new portalWnd.phraseObj("forms")
		alert(portalWnd.erpPhrases.getPhrase("ERR_NO_FORM_NAME"))
		return;
	}

	//were we told that this is a menu?
	isMenu = (typeof(isMenu) != "boolean" ? false : isMenu);
	
	// is this a menu token?
	if(isMenu || TKN.match(menuRE))
	{
		parMenu = (!parMenu ? null : parMenu);
		buildMenu(TKN,PDL,parMenu);
		return
	}

	var strFormsrc=frmBuildXpressCall(TKN, PDL, "notmodal", hkey, id, null, null, host)

	if (typeof(wind) == "undefined" || wind==null || wind=="")
		switchContents(strFormsrc)
	else
	{
		// if it is a frame reference
		if(typeof(wind.src)!="undefined")
			wind.src=strFormsrc
		else
			wind.location.href=strFormsrc
	}

	if (host=="page")
	{
		try { wind.contentWindow.name=wind.id;
		}catch(e){ }
	}
}

//-----------------------------------------------------------------------------
function frmBuildXpressCall(TKN, PDL, mode, hkey, id, custom, output, host)
{
	if (typeof(mode) == "undefined" || mode==null)
		mode="notmodal"
	if (typeof(hkey) == "undefined" || hkey==null)
		hkey=""
	if (typeof(id) == "undefined" || id==null)
		id=""
	if (typeof(custom) == "undefined" || custom==null)
		custom=""
//	if (typeof(output) == "undefined" || output==null)
		output="xml"
		//output="html"
	if (typeof(host) == "undefined" || host==null)
		host="portal"
	if (lawsonPortal.xsltSupport)
	{
		if(IEXMLSERVICE==null)
			IEXMLSERVICE=new IEFormService(portalWnd)
		output="xml"
	}

	var uselists=oUserProfile.getPreference("uselist");
	// in 8.0.3, the XSL for 4.0 Portal is named lawformc40.xsl
	// while in 8.1.0 the XSL for 4.0 Portal is lawformc.xsl
	var iosVersion=oPortalConfig.getShortIOSVersion();
	var xslName="lawformc";

	// note: do not re-order _PARMS; lawformc.xsl dependent on order.
 	var strXML="_TKN="+TKN+"&_PDL="+PDL+"&_CONTENTDIR="+lawsonPortal.path + "/content" +
 			"&_XSL="+xslName+"&_COMP=true&_CUST="+custom+"&_OUT="+output+"&_ID="+id +
 			"&_PARMS=rootdir|"+lawsonPortal.path + "||mode|"+mode+"||pdl|"+PDL+ 
 			"||hkey|"+hkey+"||host|"+host+"||uselists|"+uselists+
			"||iosVersion|"+iosVersion+
			"||portalVersion|"+portalWnd.oPortalConfig.getPortalVersion()+
			"||&_NOCACHE=" + (new Date().getTime());

 	var strXpress="/servlet/Xpress?"
	if (lawsonPortal.xsltSupport)
 		strXpress=lawsonPortal.formsDir+"/formhost.htm?"+strXML
	else
 		strXpress=lawsonPortal.formsDir+"/formhost2.htm?"+strXML
 		// strXpress+=strXML

 	return(strXpress)
}

//-----------------------------------------------------------------------------
function frmSwitchTab(wnd, tab)
{
	// if tab is already active return
	if (tab.className == "activeTab") return;

	// if tab is disabled return (firstChild is BUTTON)
	if (tab.disabled || (tab.firstChild && tab.firstChild.disabled))
		return;

	// check for custom script
	if (typeof(wnd.TABREGION_OnBeforeTabActivated)=="function")
	{
		if (!wnd.TABREGION_OnBeforeTabActivated(tab.id))
			return;
	}
	else if (typeof(wnd.TABREGION_OnTabActivated)=="function")
	{
		if (!wnd.TABREGION_OnTabActivated(tab.id))
			return;
	}

	var nbr = ""
	// set all buttons inactive
	var par = tab.parentNode;
	var tr = tab.parentNode.parentNode;
	for (var i = 0; i < par.childNodes.length; i++)
	{
		if (par.childNodes[i].nodeName == "#text"
		|| par.childNodes[i].nodeName == "#comment")
			continue;
		if ( !par.childNodes[i].disabled )
		{
			if (par.childNodes[i].className == "activeTab")
			{
				nbr = wnd.document.getElementById(par.childNodes[i].id+"PANE").getAttribute("fld")
				if (nbr && nbr != "")
				{
					if(tr.getAttribute("name").indexOf("DT") >= 0)
					{
						var dt = wnd.document.getElementById(tr.getAttribute("name"))
						for (var x = 0; x < dt.getAttribute("rows"); x++)
							wnd.tranMagic.setElement(nbr+"r"+x, "0")
					}
					else
					{
						// application specified state: 0=inactive,1=disabled,2=active
						if (wnd.tranMagic.getElement(nbr)!=1)
						wnd.tranMagic.setElement(nbr, "0")
					}
				}
			}
		}
		if (par.childNodes[i].className != "dropTab")
			par.childNodes[i].className = "";
	}

	// set this button active
	var pane = wnd.document.getElementById(tab.id+"PANE");
	tab.className = "activeTab";
	tr.setAttribute("curtab", tab.id);

	nbr = pane.getAttribute("fld");
	if (nbr && nbr != "")
	{
		if (tr.getAttribute("name").indexOf("DT") >= 0)
		{
			var dt = wnd.document.getElementById(tr.getAttribute("name"));
			for (var x = 0; x < dt.getAttribute("rows"); x++)
				wnd.tranMagic.setElement(nbr+"r"+x, "2");
		}
		else
			wnd.tranMagic.setElement(nbr, "2");
	}

	frmSetActivePane(wnd, tab);

	// check for custom script
	if(typeof(wnd.TABREGION_OnAfterTabActivated)=="function")
		wnd.TABREGION_OnAfterTabActivated(tab.id);
}

//---------------------------------------------------------------------------------------
// find the first visible input field on a tab and set focus
function frmSetActivePane(wnd, tab)
{
	// set all panes inactive
	try {
		var tabPane=wnd.document.getElementById(tab.id + "PANE")
		var par = tabPane.parentNode;
		for (var i = 0; i < par.childNodes.length; i++)
		{
			if (par.childNodes[i].nodeName == "#text"
			|| par.childNodes[i].nodeName == "#comment")
				continue;
			if (par.childNodes[i].className
			&& par.childNodes[i].className.substr(0,7) == "tabPane" )
				par.childNodes[i].className = "tabPaneInactive";
		}

		if (tabPane.getAttribute("painted") != "true")
		{
			tabPane.setAttribute("painted","true")
			if (oBrowser.isIE)
			{
				tabPane.innerHTML=portalWnd.IEXMLSERVICE.buildTab(tab.id,wnd.lawForm.IEXML)
				if (!wnd.strTKN.match(flowRE))	// if not flowchart set tab data
				{
					if (par.getAttribute("name").indexOf("DT")>=0)
		            {
			            if (wnd.formState.currentRow == "")
				            wnd.formState.setValue("currentRow", 0)
						wnd.tranMagic.setTabData(tab.id, wnd.formState.currentRow)
		            }
					else
						wnd.tranMagic.setTabData(tab.id)
				}
			}
			// if this pane contains a tabregion, position active button image
			wnd.setTimeout("lawformInitTabs('"+par.getAttribute("id")+"')",10);
		}
		tabPane.className = "tabPaneActive" + 
			(tabPane.getAttribute("isSubPane") == "1" ? "Sub" : "");
		var imgBottom=wnd.document.getElementById("imgTabBottom"+
			(tabPane.getAttribute("isSubPane") == "1" ? par.getAttribute("id") : ""));

		// is this tab one of the overflow?
		if (tab.style.display=="none")
		{
			// hide the current last visible tab and show this one
			var tabContainer=tab.parentNode;
			var lastVisible=tabContainer.getAttribute("lastVisible");
			var lastTab=wnd.document.getElementById(lastVisible);
			lastTab.style.display="none";
			tab.style.display="inline";
			tabContainer.setAttribute("lastVisible",tab.id);

			// must reposition drop button
			var dropDiv=wnd.document.getElementById(par.id+"dropDiv");
			dropDiv.style.right=(tabContainer.offsetWidth-(tab.offsetLeft+tab.offsetWidth)-(dropDiv.offsetWidth))+"px";
		}
		// reposition the tab bottom image
		imgBottom.style.left = ((tab.offsetLeft + 1) < 0 ? 0 : tab.offsetLeft+1);
		imgBottom.style.width = ((tab.offsetWidth - 2) < 0 ? 0 : tab.offsetWidth-2);
		imgBottom.style.display="inline";

		if (!wnd.formState.agsError)
			frmPositionInFirstTabField(wnd, tabPane)
		
	} catch (e) {
		portalWnd.cmnErrorHandler(e,window,FORMSFORMUTILJS);
	}
}

//---------------------------------------------------------------------------------------
// valid portal-wide function
function frmPositionInSearch()
{
	var srchFld=portalWnd.document.getElementById("findText");
	if (!srchFld) return;
	try {
		srchFld.focus();
		srchFld.select();
	} catch (e) { }
}

//---------------------------------------------------------------------------------------
// valid portal-wide function
function frmPositionInToolbar()
{
	var toolBar=portalWnd.document.getElementById("lawtoolbar");
	if (!toolBar) return false;

	var tbList=toolBar.getElementsByTagName("BUTTON");
	for (var i = 0; i < tbList.length; i++)
	{
		if (tbList[i].disabled) continue;
		if (tbList[i].style.visibility=="hidden") continue;

		try {
			window.focus();
			tbList[i].focus();
		} catch (e) { }
		return true;
	}
	return false;
}

//---------------------------------------------------------------------------------------
// find the first visible input field on a tab and set focus
function frmPositionInFirstTabField(wnd, tr)
{
	if(wnd.formState.agsError) return

	try {
		var fld = null;
		var inpFlds=tr.getElementsByTagName("*")
		for (var i = 0; i < inpFlds.length; i++)
		{
			if (inpFlds[i].nodeName.toLowerCase() != "input" 
			&& inpFlds[i].nodeName.toLowerCase() != "button")
				continue;
			if (inpFlds[i].nodeName.toLowerCase() == "button")
			{
				var parElem=inpFlds[i].parentNode;
				if (!parElem) continue;
				if ( parElem.style && parElem.style.visibility
				&& parElem.style.visibility.toLowerCase()=="hidden")
					continue;
			}
			if ( inpFlds[i].style && inpFlds[i].style.visibility
			&& inpFlds[i].style.visibility.toLowerCase()=="hidden")
				continue;
			if ( inpFlds[i].getAttribute("type").toLowerCase()!="hidden" )
			{
				fld=inpFlds[i];
				break;
			}
		} 
		if (fld)
		{
			wnd.lawForm.positionInField(fld.id);			
		}
		else
		{
			var id = tr.id.replace("PANE","BTN")
			var tbLbl=wnd.document.getElementById(id)
			wnd.lastControl=tr;
			if (wnd.lawForm.fldHelp)
				frmShowFieldHelp(wnd, id)
			if (tbLbl) tbLbl.focus();
		}

	} catch(e){ }
}

//---------------------------------------------------------------------------------------
function frmHighlightErrorField(wnd, errfld)
{
	var mElement=frmFieldIntoView(wnd, errfld);
	if (!mElement && errfld.indexOf("r")>0)
		mElement=frmFieldIntoView(wnd, errfld.replace(/r\d+/, "r0"))

	// could not highlight error field, select first field instead
	if (!mElement)
	{
		wnd.lawForm.positionInFirstField(true);
		return;
	}

	if (errfld.indexOf("r") > 0)
	{
		if (wnd.formState.currentDetailArea == "")
		{
			try {
				var dtlNbr=mElement.getAttribute("det")
				wnd.formState.setValue("currentDetailArea",dtlNbr)
			}catch(e) {}
		}						
		frmSetActiveRow(wnd, null, errfld.substr(errfld.indexOf("r")+1))
	}	
	wnd.lawForm.positionInField(mElement.id)
	if (wnd.oWizard!=null && wnd.oWizard.isVisible)
		wnd.oWizard.errorHandler(mElement)
	var reqItem = wnd.listColl.getItem(mElement.id)

	if(mElement.value=="" && reqItem != null
	&& oUserProfile.getPreference("autoselect")=="1")
	{
		if (mElement.getAttribute("hsel")=="1")
		{
			wnd.formState.autoComplete=true
			wnd.formState.autoCompleteFC=wnd.lawForm.magic.getElement(wnd.strFrmFCFldNbr)
			wnd.setTimeout("lawformAutoSelect('" + mElement.id+ "')", 50)
		}
	}
}

//---------------------------------------------------------------------------------------
function frmFieldIntoView(wnd, field)
{
	var fld=wnd.document.getElementById(field)
	var strParent="";
	var fldNode=null

	// branch for IE, if the field is not generated yet
	if(!fld)
	{
		if (lawsonPortal.xsltSupport)
		{
			fldNode = wnd.lawForm.IEXML.selectSingleNode("//fld[@nbr='"+field.replace(/r\d+/,"r0")+"']")
			if(!fldNode)fldNode = wnd.lawForm.IEXML.selectSingleNode("//push[@nbr='"+field+"']")
			if (!fldNode) return null;
			if(fldNode.getAttribute("tp") && fldNode.getAttribute("tp").toLowerCase() == "hidden")return null;
			strParent = fldNode.getAttribute("par")
			if(!strParent) return null;
		}
		else
			return null;
	}
	else
	{
		if(fld.getAttribute("tp") && fld.getAttribute("tp").toLowerCase() == "hidden")return null;
		strParent = fld.getAttribute("name")
	}

	var arrSwitchTabs = new Array()
	var parent=null;
	var i=0
	var strElement = ""
	if(strParent.indexOf("TF") >= 0)
	{
		while(strParent != "form")
		{
			if(strParent.indexOf("TF") >= 0)strElement=strParent+"PANE";
			else strElement=strParent;

			parent=wnd.document.getElementById(strElement)
			if(!parent && lawsonPortal.xsltSupport)
			{
				fldNode = wnd.lawForm.IEXML.selectSingleNode("//tab[@nbr='"+strParent+"']")
				arrSwitchTabs[i] = new Array()
				arrSwitchTabs[i][0] = strParent
				arrSwitchTabs[i][1] = fldNode.getAttribute("par")
				i++;
				fldNode = wnd.lawForm.IEXML.selectSingleNode("//tabregion[@nbr='"+fldNode.getAttribute("par")+"']")
				strParent=fldNode.getAttribute("par")
				strElement=(strParent.indexOf("TF") != -1) ? strParent+"PANE" : strParent
				parent = wnd.document.getElementById(strElement)
				if(!parent) return null;
				// Is field in a disabled tab?
				var fldVal=parent.getAttribute("fld")
				if (strElement.indexOf("PANE") >= 0 && fldVal)
				{
					var tabDisabled=wnd.lawForm.magic.getElement(fldVal)
					if(tabDisabled=="1") return null
				}		
			}
			
			// Is field in a disabled tab?
			var fldVal=parent.getAttribute("fld")
			if (strElement.indexOf("PANE") >= 0 && fldVal)
			{
				var tabDisabled=wnd.lawForm.magic.getElement(fldVal)
				if(tabDisabled=="1") return null
			}					
			
			if(parent.getAttribute("name").indexOf("DT") >= 0)
				parent=wnd.document.getElementById(parent.getAttribute("name"))
			else if(parent.getAttribute("name") == "form")break;

			arrSwitchTabs[i] = new Array()
			arrSwitchTabs[i][0] = strParent
			arrSwitchTabs[i][1] = parent.getAttribute("name")
			i++;
			strParent=parent.getAttribute("name");
		}
	}
	else if(strParent.indexOf("DT") >= 0)
	{
		while(strParent != "form")
		{
			if(strParent.indexOf("TF") >= 0)strElement=strParent+"PANE";
			else strElement=strParent;

			parent = wnd.document.getElementById(strElement)

			if(!parent && lawsonPortal.xsltSupport)
			{
				fldNode = wnd.lawForm.IEXML.selectSingleNode("//detail[@nbr='"+strParent+"']")
				parent = wnd.document.getElementById(fldNode.getAttribute("par")+"PANE")
				if(!parent) return null;
				else
				{
					// Is field in a disabled tab?
					var fldVal=parent.getAttribute("fld")
					if (fldVal)
					{
						var tabDisabled=wnd.lawForm.magic.getElement(fldVal)
						if(tabDisabled=="1") return null
					}	
			
					arrSwitchTabs[i] = new Array()
					arrSwitchTabs[i][0]=fldNode.getAttribute("par");
					arrSwitchTabs[i][1]=parent.getAttribute("name")
					strParent = parent.getAttribute("name");
					i++;
					continue;
				}
			}

			// Is field in a disabled tab?
			var fldVal=parent.getAttribute("fld")
			if (strElement.indexOf("PANE") >= 0 && fldVal)
			{
				var tabDisabled=wnd.lawForm.magic.getElement(fldVal)
				if(tabDisabled=="1") return null
			}	
					
			if(parent.getAttribute("name") == "form")break;
			else if (parent.getAttribute("name").indexOf("TF") >= 0 && strParent.indexOf("DT") >= 0)
			{
				strParent = parent.getAttribute("name")
				parent = wnd.document.getElementById(strParent+"PANE")
				arrSwitchTabs[i] = new Array()
				arrSwitchTabs[i][0]=strParent
				arrSwitchTabs[i][1]=parent.getAttribute("name")
				i++
			}
			else
			{
				arrSwitchTabs[i] = new Array()
				arrSwitchTabs[i][0]=strParent
				arrSwitchTabs[i][1]=parent.getAttribute("name")
				i++
			}
			strParent=parent.getAttribute("name");
		}
	}

	if(arrSwitchTabs.length)
	{
		for(i=arrSwitchTabs.length - 1; i >= 0 ; i--)
			if(arrSwitchTabs[i][0].indexOf("DT") < 0)wnd.lawForm.setActiveTab(arrSwitchTabs[i][0])
		fld=wnd.document.getElementById(field);
	}
	return fld;
}

//---------------------------------------------------------------------------------------
// call the drill object doDrill
function frmDoDrill(wnd, keynbr, fld)
{
	var htmElem=wnd.document.getElementById(fld)
	htmElem.focus()
	wnd.lastControl=htmElem

	// convert detail field id to row zero
	var row = -1
	var rowposition = fld.indexOf("r")
	if (rowposition > 0)
	{
		row=wnd.formState.currentRow
		fld = fld.replace(/r\d+/,"r0")
	}

	if(typeof(keynbr)=="undefined" || keynbr==null)
		keynbr=htmElem.getAttribute("knb")

	var IDACall=wnd.frmMakeIDAString("DT",fld)

	var lineAtt=wnd.frmElement.getAttribute("line")
	var scrAtt=wnd.frmElement.getAttribute("scr")

	if (lineAtt != null && rowposition > 0)
		IDACall+="&_LKN="+lineAtt

	if (scrAtt != null)
		IDACall+="&_SKN="+scrAtt

	IDACall += "&_KNB=" + (keynbr ? keynbr : "");

	// is there custom script for drill selects? -- allows for customization for IDA call
	// (may be cancelled by returning null or empty string, so if implemented the default
	// behavior should be to return the ida call passed in as parm 2.)
	if(typeof(wnd.TEXT_OnDrillSelect)=="function")
	{
		try	{
			var txtItem=wnd.idColl.getItemByFld(fld)
			var returnStr=wnd.TEXT_OnDrillSelect(txtItem.id, IDACall, row)
			if (returnStr && returnStr!="")
				IDACall=returnStr
			else return
		} catch (e) { }
	}

	var bOpen = portalWnd.oUserProfile.isOpenWindow("explorer");
	if (!bOpen)
		formUnload(true);
	if (wnd.strHost.toLowerCase()!="page")
	{
		if (!bOpen)
			portalWnd.lawsonPortal.setTitle(wnd.strTitle + " - " +
				"Drill Around" + String.fromCharCode(174));
	}
	wnd.formState.setValue("formReady",false)
	portalWnd.lawsonPortal.drill.doDrill(wnd,"lawformExplorerDone",IDACall,wnd.strIDAPath)
}

//---------------------------------------------------------------------------------------
// call the drill object doSelect
function frmDoSelect(wnd, keynbr, fld)
{
	// form disabled?
	if (!wnd.formState.formReady) return

	var htmElem=wnd.document.getElementById(fld)
	wnd.lastControl=htmElem

	// convert detail field id to row zero
	var row = -1
	var rowposition = fld.indexOf("r")
	if (rowposition > 0)
	{
		// field in a subordinate tab?
		var parent=htmElem.getAttribute("par")
		if (parent && parent.indexOf("TF")!=-1)
			row=wnd.formState.currentRow
		else
		{
			row=fld.substring(rowposition+1,fld.length)
			wnd.formState.setValue("currentRow",row)
		}
		fld = fld.replace(/r\d+/,"r0")
	}
	try{
		if(!htmElem.getAttribute("hsel") || htmElem.getAttribute("tp")=="select") 
			return htmElem.focus();
	}catch(e) {	return htmElem.focus(); }

	if(typeof(keynbr)=="undefined" || keynbr==null)
		keynbr=htmElem.getAttribute("knb")

	var IDACall=wnd.frmMakeIDAString("SL",fld,keynbr)

	// is there custom script for drill selects? -- allows for customization for IDA call
	// (may be cancelled by returning null or empty string, so if implemented the default
	// behavior should be to return the ida call passed in as parm 2.)
	if(typeof(wnd.TEXT_OnDrillSelect)=="function")
	{
		try	{
			var txtItem=wnd.idColl.getItemByFld(fld)
			var returnStr=wnd.TEXT_OnDrillSelect(txtItem.id, IDACall, row)
			if (returnStr && returnStr!="")
				IDACall=returnStr
			else return htmElem.focus();
		} catch (e) { }
	}

	var bOpen = portalWnd.oUserProfile.isOpenWindow("select");
	if (!bOpen)
		formUnload(true);
	if (wnd.strHost.toLowerCase()!="page")
	{
		if (!bOpen)
			portalWnd.lawsonPortal.setTitle(wnd.strTitle + " - " +
				"Drill Around" + String.fromCharCode(174));
	}
	wnd.formState.setValue("formReady",false)
	var obj = frmAllowDrill(wnd,htmElem)	// pt-163346
	portalWnd.lawsonPortal.drill.doSelect(wnd, "lawformDrillSel", IDACall, wnd.strIDAPath,obj.retVal)	// pt-163346
}

//---------------------------------------------------------------------------------------
// call the drill object doList
function frmDoList(wnd)
{
	// form disabled?
	if (!wnd.formState.formReady) return

	formUnload(true)

	// just to be safe, let's test the host...
	// (this shouldn't be called if on a portal page)
	if (wnd.strHost.toLowerCase()!="page")
	{
		portalWnd.lawsonPortal.setTitle(wnd.strTitle + " - " +
			portalWnd.lawsonPortal.getPhrase("LBL_LIST_SELECT"))
	}

	wnd.formState.setValue("formReady",false)
	portalWnd.lawsonPortal.drill.doList(wnd, "lawformListDone", wnd.listColl,
			"frmMakeIDAString", wnd.strTitle, "lawformListUpdated", wnd.strIDAPath)
}

//---------------------------------------------------------------------------------------
// show attachments window
function frmDoAttachments(wnd, knb, fld)
{
	// form disabled?
	if (!wnd.formState.formReady) return

	var fldNbr;
	var keyNbr;
	var mElement=null

	if (typeof(knb)!="undefined" && typeof(fld)!="undefined")
	{
		fldNbr=fld;
		keyNbr=knb;
		mElement=wnd.document.getElementById(fldNbr)
	}
	else
	{
		if (!wnd.lastControl) return;
		fldNbr=wnd.lastControl.id
		mElement=wnd.document.getElementById(fldNbr)
		keyNbr=mElement.getAttribute("knb")
	}

	if (!mElement) return;

	var attCMT=mElement.getAttribute("attcmt")
	var attURL=mElement.getAttribute("atturl")
	var attType=""
	if (mElement.getAttribute("tp") == "push")
	{
		var key=mElement.getAttribute("knb")
		if (key && key != "")
		{
			if (key.indexOf("=CM")!=-1)
				attType="CMT"
			if (key.indexOf("=UR")!=-1)
				attType="URL"
		}
	}
	if (attType == "")
	{
		if (attCMT=="1")
			attType="CMT"
		if (attURL=="1")
			attType = (attType=="" ? "URL" : attType + "/URL")
		if (attType == "" ) return;
	}

	var bOpen = portalWnd.oUserProfile.isOpenWindow("attachment");
	if (!bOpen)
		formUnload(true);
	if (wnd.strHost.toLowerCase()!="page")
	{
		if (!bOpen)
			portalWnd.lawsonPortal.setTitle(wnd.strTitle + " - " +
				portalWnd.lawsonPortal.getPhrase("LBL_ATTACHMENTS"))
	}

	var idaCall = wnd.frmMakeIDAString(attType,fldNbr,keyNbr)

	var rowposition = fld.indexOf("r")
	var lineAtt=wnd.frmElement.getAttribute("line")
	var scrAtt=wnd.frmElement.getAttribute("scr")

	if (lineAtt != null && rowposition > 0)
		idaCall+="&_LKN="+lineAtt

	if (scrAtt != null)
		idaCall+="&_SKN="+scrAtt

	wnd.formState.setValue("formReady",false)
	portalWnd.lawsonPortal.drill.doAttachment(wnd, "lawformAttachDone", idaCall, attType)
}

//---------------------------------------------------------------------------------------
// show define window
function frmDoDefine(wnd, deftkn, fld)
{
	// form disabled?
	if (!wnd.formState.formReady) return

	// do we have a token
	if (!deftkn || deftkn=="") return
	// are we already there?
	if (deftkn.toUpperCase()==wnd.strTKN.toUpperCase()) return

	var mElement
	var iPos=fld.indexOf("r")
	if (iPos != -1)
	{
		var fldNbr=fld.replace(/r\d+/,"r0")
		mElement=wnd.document.getElementById(fldNbr)
		if (!mElement) return;
		wnd.formState.setValue("doDefine",true)
		wnd.formState.setValue("pushFromRow",true)
		wnd.formState.setValue("currentDetailArea",mElement.getAttribute("det"))
		wnd.formState.setValue("currentField",fld)
		wnd.lawformFillDefaults(wnd.formState.currentRow)
	}
	else
	{
		mElement=wnd.document.getElementById(fld)
		wnd.formState.setValue("doDefine",true)
	 	wnd.formState.setValue("currentRow",0)
		wnd.formState.setValue("pushFromRow",false)
		wnd.formState.setValue("currentDetailArea","")
		wnd.formState.setValue("currentField",fld)
		wnd.lawformFillDefaults()
	}

	//sync up the data (magic) and the screen.
	wnd.tranMagic.getUIData();
	
	strSource=frmBuildXpressCall(deftkn,wnd.strPDL,"modal",null,null,null,null,wnd.strHost)
	wnd.formState.setValue("formReady",false)
	wnd.lawformPushWindow(strSource)
}

//---------------------------------------------------------------------------------------
// build up and display drop down div with context menu
function frmShowContextMenu(evt, wnd, mElement)
{
	// form disabled?
	if (!wnd.formState.formReady) return;

	if (typeof(mElement) == "undefined")
	{
		mElement=wnd.document.activeElement
		if (typeof(mElement) == "undefined") return;
	}
	if (!mElement || !mElement.id) return
	if (mElement.id.substr(0,2)!="_f") return;

	mElement.focus()
	wnd.lastControl=mElement

	if (!wnd.oDropDown)
		wnd.oDropDown=new wnd.Dropdown()
	wnd.oDropDown.clearItems()

	var currentRow = -1
	var iPos=mElement.id.indexOf("r")
	if (iPos != -1)
	{
		currentRow=wnd.formState.currentRow
		try{
			wnd.formState.setValue("currentDetailArea",mElement.getAttribute("det"))
		}catch(e){}
	}

	var count=0
	var tp=mElement.getAttribute("tp")
	var obj = frmAllowDrill(wnd, mElement);
	if (obj.retVal)
	{
		wnd.oDropDown.addItem("Drill Around" + String.fromCharCode(174), "drill|" + obj.value);
		count++;
	}
	if((tp=="text")
	&& mElement.getAttribute("hsel")=="1"
	&& mElement.getAttribute("knb") )
	{
		wnd.oDropDown.addItem(lawsonPortal.getPhrase("LBL_SELECT"), "select|"+mElement.getAttribute("knb"))
		count++
	}

	obj = frmAllowAttachment(wnd, mElement);
	if (obj.retVal)
	{
		wnd.oDropDown.addItem(lawsonPortal.getPhrase("LBL_ATTACHMENTS"), "attach|" + mElement.getAttribute("knb"));
		count++;
	}

	if((tp=="text")
	&& mElement.getAttribute("deftkn")
	&& (mElement.getAttribute("deftkn") != wnd.strTKN) )
	{
		wnd.oDropDown.addItem(lawsonPortal.getPhrase("LBL_DEFINE"), "define|"+mElement.getAttribute("deftkn"))
		wnd.oDropDown.addItem(lawsonPortal.getPhrase("LBL_OPEN"), "open|"+mElement.getAttribute("deftkn"))
	 	count++
	}

	if (count>0)
	{
		wnd.oDropDown.show("", mElement, "lawformContextSel")
		evt=getEventObject(evt)
		if (evt) setEventCancel(evt)
	}
}

//---------------------------------------------------------------------------------------
function frmShowCalendar(wnd, fld)
{
	// form disabled?
	if (!wnd.formState.formReady) return

	var mElement=wnd.document.getElementById(fld)
	wnd.lastControl=mElement

	var strDate = wnd.lawForm.getElementValue(mElement.id)
	var sz=mElement.getAttribute("size")
	var oDate=null
	if (strDate!="")
		oDate=portalWnd.edGetDateObject(strDate,sz)
	if (!oDate || isNaN(oDate))
	{
		oDate = new Date()
		if (strDate != "")
			wnd.lawForm.setElementValue(mElement.id,"")
	}

	if (!wnd.oDropDown)
		wnd.oDropDown=new wnd.Dropdown()
	wnd.oDropDown.show(oDate, mElement, "lawformCalendarSel")
}

//---------------------------------------------------------------------------------------
// build up and display drop down div
function frmShowDropDown(wnd, fld)
{
	// form disabled?
	if (!wnd.formState.formReady) return;

	var mElement=wnd.document.getElementById(fld)
	if(mElement.getAttribute("disabled")==true) return;
	mElement.focus()
	wnd.lastControl=mElement

	if (!wnd.oDropDown)
		wnd.oDropDown=new wnd.Dropdown()
	wnd.oDropDown.clearItems()

	var vals=frmGetFieldValueList(wnd, fld)
	var selItem=""

	for (var i = 0; i < vals.length; i++)
	{
		var displayVal = vals[i].getAttribute("disp");
		var tranVal = tranVal = vals[i].getAttribute("tran");
		var obj = displayVal + "|" + tranVal;
		var id = (portalWnd.trim(displayVal) == portalWnd.trim(vals[i].getAttribute("text")))
				? displayVal
				: displayVal + " " + vals[i].getAttribute("text");

		if (displayVal.indexOf(":") != -1)
		{
			var rangeAry = displayVal.split(":");
			id = (displayVal == vals[i].getAttribute("text"))
				? displayVal
				: displayVal + " " + vals[i].getAttribute("text");
			obj =  rangeAry[0] + "|" + rangeAry[0];
		}
				
		
		wnd.oDropDown.addItem(id,obj)
		if (vals[i].getAttribute("disp")==wnd.lawForm.getElementValue(fld))
			selItem=obj
	}
	wnd.oDropDown.show(selItem, mElement, "lawformDropSel")
}

//---------------------------------------------------------------------------------------
function frmGetFieldValueList(wnd, fld)
{
	var vallist=wnd.document.getElementById("VALUES"+fld)
	if (!vallist) return null;

	var vals=vallist.getElementsByTagName("SPAN")
	return vals;
}

//---------------------------------------------------------------------------------------
function frmToggleFieldHelp(wnd, fld)
{
	if (!wnd) return;
	if (!fld) return;
	var mElement=wnd.document.getElementById(fld);
	if (!mElement) return;
	wnd.lastControl=mElement;

	wnd.lawForm.fldHelp = !wnd.lawForm.fldHelp;
	if (wnd.lawForm.fldHelp)
	{
		portalWnd.lawsonPortal.setMessage(portalWnd.erpPhrases.getPhrase("FIELD_HELP_ENABLED"));
		frmShowFieldHelp(wnd, fld);		
	}
	else
	{
		portalWnd.lawsonPortal.setMessage(portalWnd.erpPhrases.getPhrase("FIELD_HELP_DISABLED"));
		if (wnd.oHelp.isVisible)
			wnd.oHelp.hide();
	}
}

//---------------------------------------------------------------------------------------
function frmShowFieldHelp(wnd, fld)
{
	if(!portalIsUserSSOActive(true))
	{
		portalLogout();
		return false;
	}
	
	if (!wnd) return;
	if (!fld) return;
	var mElement=wnd.document.getElementById(fld);
	if (!mElement) return;
	wnd.lastControl=mElement;

	if (wnd.oWizard && wnd.oWizard.isVisible)
		wnd.oWizard.hide();
	
	if (!wnd.oHelp)
		wnd.oHelp=new wnd.Wizard(portalWnd, wnd, wnd.strPDL, wnd.strTKN);

	wnd.oHelp.showFieldHelp(mElement);
}

//---------------------------------------------------------------------------------------
function frmDoWizard(wnd)
{
	if (wnd.oWizard && wnd.oWizard.isVisible)
		return;

	if (wnd.oHelp && wnd.oHelp.isVisible)
	{
		wnd.oHelp.hide()
		wnd.lawForm.fldHelp=false;
	}
	if (!wnd.oWizard)
		wnd.oWizard=new wnd.Wizard(portalWnd, wnd, wnd.strPDL, wnd.strTKN);
	wnd.oWizard.showWizard();
}
//-----------------------------------------------------------------------------
function frmIsValidFc(wnd,func)
{
	var validFCs = wnd.strValidFCs;
 	var pos = func.indexOf("^");
    
    	if (pos > 0)
    		func = func.substr(0, pos);
    		
    	return validFCs.indexOf(func) < 0 ? false : true;
}
//-----------------------------------------------------------------------------
function frmEvalFCPairs(wnd, func)
{
	if ( wnd.strRowFCFldNbr == "" ) return (true);

	var strFldFC=wnd.strRowFCFldNbr.substr(0, wnd.strRowFCFldNbr.length-1)
	var da = wnd.document.getElementById(wnd.formState.currentDetailArea)
	if (!da)return;
	var pos = func.indexOf("^");
	if (pos > 0) func = func.substr(0, pos);
	var fcPairs = wnd.frmElement.getAttribute("pairs");	
	for (var i = 0;i < da.getAttribute("rows") ; i++)
	{
		var rowFC=wnd.document.getElementById(strFldFC+i)
		if (! rowFC) break;			// loop exit point!

		if (rowFC.value == "") continue;
		
		if(!wnd.keyColl.validateFCPairs(rowFC.value, func, fcPairs))
		{
			var msg = portalWnd.lawsonPortal.getPhrase("INVALID_LINE_FC");
			frmHighlightErrorField(wnd, rowFC.getAttribute("id"))
			portalWnd.lawsonPortal.setMessage(msg);
			return false;
		}
	}
	return (true);
}
//-----------------------------------------------------------------------------
function frmSetActiveRow(wnd, mElement, nRow)
{// change the active row in a detail area
	var rows = null;
	var rowElem = null;
	var lastRow=0;
	var dtlNbr=""
	if (mElement)
	{
		// get the row number
		var iPos=mElement.id.indexOf("r")
		if (iPos == -1) return

		// return when the element getting focus is on a subordinate tab,
		// unless the detail area is blank
		if (mElement.getAttribute("par") 
		&& mElement.getAttribute("par").indexOf("TF") >= 0)
		{
			if (wnd.formState.currentDetailArea == "")
			{
				dtlNbr=mElement.getAttribute("det");
				wnd.formState.setValue("currentDetailArea",dtlNbr);
			}
			return;
		}

		var rowNbr=mElement.id.substr(iPos+1);
		dtlNbr=mElement.getAttribute("det");

		// get the div for this row
		rowElem=wnd.document.getElementById(dtlNbr+"ROW"+rowNbr);
		lastRow = wnd.formState.currentRow;
	}
	else
	{
		dtlNbr=wnd.formState.currentDetailArea
		if (dtlNbr == "") return;
		rowElem = (typeof(nRow) != "undefined"
			? wnd.document.getElementById(dtlNbr+"ROW"+nRow)
			: wnd.document.getElementById(dtlNbr+"ROW0"));
	}
	if (!rowElem) return;
	try {
		wnd.formState.setValue("currentRow",rowElem.getAttribute("rowIndex"))
		wnd.formState.setValue("currentDetailArea",dtlNbr)
	}catch(e){}

	if (rowElem.className == "detailRowActive")
		return;
	rows=rowElem.parentNode.childNodes;

	for (var i = 0; i < rows.length; i++)
	{
		if (rows[i].className != "detailRowActive")
			continue;
		rows[i].className=(rows[i].rowIndex%2==0 
			? "detailRowEven" : "detailRowOdd");
	}
	// set style for active row
	rowElem.className="detailRowActive"

	// if detail area has a subordinate tab, 
	// find the active pane and set the data
	var detailArea = wnd.document.getElementById(dtlNbr)
	if (!detailArea || !detailArea.getAttribute("tabregion"))
		return;

	// if the current row is different from rowIndex, update Magic
	if (lastRow != rowElem.getAttribute("rowIndex"))
		wnd.tranMagic.getTabData(dtlNbr, lastRow);

	wnd.tranMagic.setTabSecurity(detailArea.getAttribute("tabRegion"), true);

	var par = wnd.document.getElementById(detailArea.getAttribute("tabregion"));
	for (i = 0; i < par.childNodes.length; i++)
	{
		if (typeof(par.childNodes[i].id) == "undefined")
			continue;
		var idxPane = par.childNodes[i].id.indexOf("PANE");
		if (idxPane >= 0)
		{
			if (par.childNodes[i].getAttribute("painted") == "true")
			{
				if (!wnd.strTKN.match(flowRE))	// if not flowchart set tab data
					wnd.tranMagic.setTabData(par.childNodes[i].id.substr(0,idxPane),
							rowElem.getAttribute("rowIndex"));
			}
		}
	}
}

//-----------------------------------------------------------------------------
function frmReturnObj()
{
	this.retVal = false;
	this.isProper = false;
	this.value = "";
}

//-----------------------------------------------------------------------------
function frmGetCurrentRowValue(wnd, id)
{
	var	currentRow = (id.indexOf("r") != -1) 
		? wnd.formState.currentRow 
		: -1;
	return currentRow == -1 
		? wnd.lawForm.getElementValue(id) 
		: wnd.lawForm.getElementValue(id, currentRow);
}

//-----------------------------------------------------------------------------
// common routine to check if an attachment can be performed
function frmAllowAttachment(wnd, mElement)
{
	var obj = new frmReturnObj();
	var strValue = frmGetCurrentRowValue(wnd, mElement.id); 
	var tp = mElement.getAttribute("tp");

	if ((tp == "text" || tp == "select" || tp == "fc")
	&& mElement.getAttribute("knb")
	&& (mElement.getAttribute("attcmt") || mElement.getAttribute("atturl")))
	{
		obj.isProper = true;
		if (strValue != "")
	 		obj.retVal = true;
	}
	return obj;
}

//-----------------------------------------------------------------------------
// common routine to check if a drill can be performed
function frmAllowDrill(wnd, mElement)
{
	var obj = new frmReturnObj();
	var strValue = frmGetCurrentRowValue(wnd, mElement.id); 
	var tp = mElement.getAttribute("tp");

	if (((tp == "text" || tp == "select")
	&& (mElement.getAttribute("hdet") == "1"))
	|| (tp == "fc"))
	{
		obj.isProper = true;
		var lineAtt = wnd.frmElement.getAttribute("line");
		var scrAtt = wnd.frmElement.getAttribute("scr");
		var keynbr = mElement.getAttribute("knb");
		if (keynbr && keynbr.substr(0,1) != "@" && tp != "fc")
		{
			obj.retVal = true;
			obj.value = keynbr;
		}
 		else if (mElement.parentNode.className.substr(0,6) == "detail" 
 				&& lineAtt && lineAtt != "")
		{
			obj.retVal = true;
			obj.value = (keynbr) ? keynbr : "";
		}
 		else if (scrAtt && scrAtt != "" && tp != "fc")
		{
			obj.retVal = true;
			obj.value = scrAtt;
		}
	}
	return obj;
}

//-----------------------------------------------------------------------------
// form state object and methods
function FormStateObj()
{
	this.doDefine=false
	this.doPush=false
	this.doTransfer=false
	this.skipInitialTxn=false
	this.formReady=false
	this.token=""
	this.pushFromRow=false
	this.currentRow=0
	this.currentField=""
	this.currentDetailArea=""
	this.currentTabPage=""
	this.selectDetailRow=false
	this.autoComplete = false
	this.autoCompleteFC=""
	this.agsError=false
	this.agsFldNbr="" // Error fldNbr
	this.agsMsgNbr=""
	this.crtio=new CRTIODataObj()
}
FormStateObj.prototype.propertyChanged=function(propertyName)
{
	//return
}
FormStateObj.prototype.setValue=function(propertyName,value)
{
	var execString=""
	var valType=typeof(value)
	switch(valType)
	{
		case "string":
			execString="this." + propertyName + "='" + value + "'"
			break
		case "object":
		case "boolean":
		default:
			execString="this." + propertyName + "=" + value
			break
	}
	try{
		eval(execString)
	}
	catch(e){}
	this.propertyChanged(propertyName)
	return true
}
// end state object and methods
//-----------------------------------------------------------------------------


//-----------------------------------------------------------------------------
// lawson form object and methods
function LawFormObj(portalWnd,formWnd)
{
	this.portalWnd=portalWnd;
	this.portalObj=portalWnd.lawsonPortal;
	this.formWnd=formWnd;
	this.UIDocument=formWnd.document;
	this.magic=null;
	this.IEXML=null;
	this.useLists=false;
	this.fldHelp=false;
	this.fldAdvance=false;
	this.useShortDate=false;
	var frmType=formWnd.frmElement.getAttribute("TYPE")
	this.isBatchForm = (frmType && (frmType=="BATCH" || frmType=="IMPEXP")
			? true : false);
}
// tab status constants
LawFormObj.prototype.nTabStatusMin=Number(0);
LawFormObj.prototype.nTabStatusMax=Number(2);
LawFormObj.prototype.nTabStatusInactive=Number(0);
LawFormObj.prototype.nTabStatusDisabled=Number(1);
LawFormObj.prototype.nTabStatusActive=Number(2);

LawFormObj.prototype.setActiveTab=function(tabNbr)
{
// assumes that tabregion for tabNbr is visible:
// makes no attempt to active a parent tab
	var retVal=false;
	try {
		var tabPane=this.UIDocument.getElementById(tabNbr+"PANE");
		if (!tabPane) return (false);

		var tabBtn=this.UIDocument.getElementById(tabNbr);
		if (!tabBtn) return (false);

		this.portalWnd.frmSwitchTab(this.formWnd,tabBtn);
		retVal=true;

	} catch (e) { }
	return retVal;
}
LawFormObj.prototype.getDataValue=function(fldName,rowNbr)
{
	var retVal=""
	try {
		var nmItem=this.formWnd.namColl.getNameItem(fldName)
		if (nmItem)
		{
			var mElement=this.magic.getElement(nmItem.fld,rowNbr);
			if(mElement)
				retVal=mElement
		}

	} catch (e) { }
	return retVal
}
LawFormObj.prototype.setDataValue=function(fldName,newValue,rowNbr)
{
	var retVal=false
	try {
		var nmItem=this.formWnd.namColl.getNameItem(fldName)
		if (nmItem)
			retVal=this.magic.setElement(nmItem.fld,newValue,rowNbr);

	} catch (e) { }
	return retVal
}
LawFormObj.prototype.getDataValueById=function(elemName,rowNbr)
{
	var retVal=""
	try {
		var idItem=this.formWnd.idColl.getItem(elemName)
		if (idItem)
			retVal=this.magic.getElement(idItem.fld,rowNbr);

	} catch (e) { }
	return retVal
}
LawFormObj.prototype.setDataValueById=function(elemName,newValue,rowNbr)
{
	var retVal=false
	try {
		var idItem=this.formWnd.idColl.getItem(elemName)
		if (idItem)
			retVal=this.magic.setElement(idItem.fld,newValue,rowNbr);

	} catch (e) { }
	return retVal
}
LawFormObj.prototype.getElement=function(elemID,rowNbr)
{
	try {
		var rowID=""
		if(typeof(rowNbr)!="undefined")
			rowID="r" + rowNbr

		var fldNbr=elemID
		if(rowID!="")
			fldNbr=fldNbr.replace(/r0/,rowID)
		var oElement=this.UIDocument.getElementById(fldNbr)
		return oElement ? oElement : null;
	} catch (e) { return null }
}
LawFormObj.prototype.getElementValue=function(elemID,rowNbr,noEmpty,applyXLT)
{
	var retVal=""
	try {
		var rowID=""
		if (typeof(rowNbr)!="undefined" && rowNbr != -1 && rowNbr != null)
			rowID="r" + rowNbr
		var fldNbr=elemID
		if(rowID!="")
			fldNbr=fldNbr.replace(/r0/,rowID)
		noEmpty = (typeof(noEmpty) == "boolean") ? noEmpty : false;			
		applyXLT = (typeof(applyXLT) == "boolean") ? applyXLT : false;
					
		var mElement=this.UIDocument.getElementById(fldNbr)
		if (!mElement && elemID.indexOf("r") != -1 && rowID != "" && rowID != "r0")
		{	// may solve some issues defaulting values on sub-tabs
			fldNbr=elemID.replace(/r\d+/, "r0");
			mElement=this.UIDocument.getElementById(fldNbr)
		}
		
		if (mElement)
		{
		 	if (mElement.nodeName=="INPUT")
			{
				if (mElement.type=="checkbox")
				{
					var vals=this.portalWnd.frmGetFieldValueList(this.formWnd, mElement.id)
					if (vals)
					{
						var ch=(mElement.checked?"1":"0")
						// default wants only if checked - sets noEmpty to true
						if (!noEmpty || ch=="1")
						{
							var len=(vals?vals.length:0)
							for (var i=0; i < len; i++)
							{
								if (vals[i].getAttribute("checked")==ch)
								{
									retVal=vals[i].getAttribute("tran")
									break
								}
							}
						}
					}
				}
			 	else if (mElement.type=="radio")
			 	{
				 	var mElementAry = this.UIDocument.getElementsByName(fldNbr);
				 	var len = mElementAry.length;
				 	for (var i=0; i < len; i++)
				 	{
				 		if(mElementAry[i].checked)
				 		{
				 			retVal = mElementAry[i].value;
				 			break;
				 		}
				 	}
			 	}			 		
				else if ((mElement.getAttribute("tp")=="select" || mElement.getAttribute("tp")=="fc") && applyXLT)
					retVal=this.magic.getFieldValue(mElement)
			 	else
			 		retVal=mElement.value
			}
			else if ((mElement.nodeName == "LABEL" || mElement.nodeName == "TEXTAREA") && this.portalWnd.oBrowser.isIE)
				retVal = mElement.innerText
		 	else
			{
				if (mElement.hasChildNodes())
		 			retVal=mElement.childNodes[0].nodeValue
				else
				{
					mElement.appendChild(this.UIDocument.createTextNode(""))
					retVal=""
				}
			}
		}
		else
			retVal=this.magic.getElement(elemID,rowNbr);
	} catch (e) { }
	return retVal
}
LawFormObj.prototype.setElementValue=function(elemID,newValue,rowNbr)
{
	var retVal=false
	try {
		var rowID=""
		if(typeof(rowNbr)!="undefined")
			rowID="r" + rowNbr
		var fldNbr=elemID
		if(rowID!="")
			fldNbr=fldNbr.replace(/r0/,rowID)
		var mElement=this.UIDocument.getElementById(fldNbr)
		if (!mElement)
		{
			// elements on tabs on detail areas are always 'row 0'
			var iPos=fldNbr.search(/r[1-9]\d*$/)
			if (iPos != -1)
				mElement=this.UIDocument.getElementById(fldNbr.replace(/r\d+$/,"r0"))
		}
		if (mElement)
		{
			if (mElement.nodeName=="INPUT")
			{
			 	if (mElement.type=="checkbox")
				{
					var vals=this.portalWnd.frmGetFieldValueList(this.formWnd, mElement.id)
					var len=(vals ? vals.length: 0);
					for (var i=0; i < len; i++)
					{
						if (vals[i].getAttribute("tran")==newValue)
						{
							mElement.checked=(vals[i].getAttribute("checked")=="1");
							break;
						}
					}
				}
			 	else if (mElement.type=="radio")
			 	{
					mElement=this.UIDocument.getElementsByName(fldNbr)
					var len=(mElement ? mElement.length : null);
					for (var i=0; i < len; i++)
						mElement[i].checked=(mElement[i].tran==newValue)
			 	}
				else
			 		mElement.value=newValue
			}
			else if (mElement.nodeName == "LABEL" && this.portalWnd.oBrowser.isIE)
				mElement.innerText=newValue
		 	else
			{
				if (mElement.hasChildNodes())
				{
					var textNode=mElement.childNodes[0]
					if ((textNode.nodeType==3) || (textNode.nodeType==4))
			 			mElement.childNodes[0].nodeValue=newValue
					else
						mElement.appendChild(this.UIDocument.createTextNode(newValue))
				}
				else
					mElement.appendChild(this.UIDocument.createTextNode(newValue))

				if (mElement.nodeName=="LABEL" && mElement.getAttribute("tp")=="out")
					mElement.setAttribute("title", newValue);
			}
		}
		if (!this.magic.initialized || !mElement)
			this.magic.setElement(fldNbr, newValue)
		retVal=true
	} catch (e) { }
	return retVal
}
LawFormObj.prototype.getFormElement=function(elemName,rowNbr)
{
	var mElement=null;
	try {
		var idItem=this.formWnd.idColl.getItem(elemName)
		if (idItem)
		{
			var fld=idItem.fld
			var pos=fld.indexOf("r")
			// id collection only holds 'r0' fields
			if(typeof(rowNbr)!="undefined" && pos > 0)
				fld=fld.replace(/r0/g, "r"+rowNbr)
			mElement=this.UIDocument.getElementById(fld)

			if (!mElement && pos > 0 && rowNbr != "" && rowNbr != "0")
			{	// may solve some finding elements on sub-tabs
				fld=idItem.fld
				mElement=this.UIDocument.getElementById(fld)
			}

			if (mElement && mElement.nodeName=="IFRAME")
			{
				if (this.portalWnd.oBrowser.isIE)
					mElement=this.UIDocument.frames[fld]
				else
					mElement=this.formWnd.frames[fld]
			}
		}

	} catch (e) { }
	return (mElement);
}
LawFormObj.prototype.getFormValue=function(elemName,rowNbr)
{
	var retVal=""
	try {
		var mElement=this.getFormElement(elemName,rowNbr);
		if(mElement)
			retVal=this.getElementValue(mElement.id,rowNbr);

	} catch (e) { }
	return retVal
}
LawFormObj.prototype.setFormValue=function(elemName,newValue,rowNbr)
{
	var retVal=false
	try {
		var mElement=this.getFormElement(elemName,rowNbr);
		if(mElement)
		{
			retVal=this.setElementValue(mElement.id,newValue,rowNbr);
			this.portalWnd.lawsonPortal.keyBuffer = null
		}

	} catch (e) { }
	return retVal
}
LawFormObj.prototype.getMessage=function()
{
	return this.magic.getElement("Message")
}
LawFormObj.prototype.setMessage=function(newMsg)
{
	this.portalObj.setMessage(newMsg)
}
LawFormObj.prototype.getMessageNbr=function()
{
	return this.magic.getElement("MsgNbr")
}
LawFormObj.prototype.getPhrase=function(id,type)
{
	if (typeof(type) == "undefined" || type == "portal")
		return this.portalObj.getPhrase(id)
	else
		return this.portalWnd.erpPhrases.getPhrase(id)
}
LawFormObj.prototype.setTabState=function(tabNbr,status)
{
	if (!status || status == "" || typeof(status) != "string")
		return;

	// validate the status code
	var nStat = parseInt(status,10);
	if (nStat < this.nTabStatusMin || nStat > this.nTabStatusMax)
		return;

	var tabPane=this.UIDocument.getElementById(tabNbr+"PANE");
	if (!tabPane) return;

	// do we need to override the status and disable tab?
	if (nStat != this.nTabStatusDisabled)
	{
		// is the tab unconditionally secured? (tabprot=1)
		var tr=tabPane.getAttribute("name");
		var rgnStore=(tr ? this.formWnd.aTabRgns[tr] : null);
		if (rgnStore)
		{
			var len=rgnStore.length;
			for (var i = 0; i < len; i++)
			{
				var tabStore=rgnStore.children(i);
				if (tabStore.name != tabNbr)
					continue;
				if (tabStore.value == "1")		// secured
					nStat=this.nTabStatusDisabled;
				break;	
			}
		}

		// has the last transaction indicate tab is secured?
		var tabNode=this.magic.getElementNode(tabPane.getAttribute("fld"));
		if (tabNode && tabNode.getAttribute("secured") == "1")
			nStat=this.nTabStatusDisabled;
	}

	// get the tab 'button'
	var tabBtn = this.UIDocument.getElementById(tabNbr);
	if (!tabBtn) return;

	//return if setting the active tab to active
	if(status == this.nTabStatusActive && tabBtn.className == "activeTab")
		return;
		
	// clear the class and set disabled state on button element
	tabBtn.className="";
	tabBtn.firstChild.disabled=(nStat == this.nTabStatusDisabled ? true : false);

	// is this tab active?
	if (nStat == this.nTabStatusActive)
	{
		// non-IE only: fixes a bug(?) were no tab pane is active.
		if (!this.portalObj.xsltSupport && tabPane.className.substr(0,13) != "tabPaneActive")
			tabPane.className = tabPane.className.replace(/Inactive/, "Active")
		this.setActiveTab(tabNbr)
	}
}
LawFormObj.prototype.changeTabName=function(tabNbr,name)
{
	if (!name) return;

	var tabPane=this.UIDocument.getElementById(tabNbr+"PANE")
	if (!tabPane) return

	this.UIDocument.getElementById(tabNbr).firstChild.nodeValue=name;
}
LawFormObj.prototype.findFirstField=function()
{
	try {
		var inpFlds=this.UIDocument.getElementsByTagName("*")
		var len=(inpFlds ? inpFlds.length : 0);
		for (var i = 0; i < len; i++)
		{
			if (inpFlds[i].nodeName.toLowerCase() != "input" 
			&& inpFlds[i].nodeName.toLowerCase() != "button")
				continue;
			if (inpFlds[i].nodeName.toLowerCase() == "button")
			{
				if (this.isBatchForm) continue;	// don't position on batch buttons
				var parElem=inpFlds[i].parentNode;
				if (!parElem) continue;

				// don't position on tab button (typically a flowchart with tabs)
				if (inpFlds[i].id == parElem.id+"BTN")
					continue;

				if ( parElem.style && parElem.style.visibility
				&& parElem.style.visibility.toLowerCase()=="hidden")
					continue;
			}
			if (inpFlds[i].style && inpFlds[i].style.visibility
			&& (inpFlds[i].style.visibility.toLowerCase()=="hidden"))
				continue;
				
			if(inpFlds[i].disabled) continue
							
			if (inpFlds[i].getAttribute("type").toLowerCase() !="hidden" 
			&& inpFlds[i].parentNode.id != "formtoolbar")
				return inpFlds[i];
		}
	} catch(e){ }
	return null;
}
LawFormObj.prototype.positionInField=function(fld)
{
	try {
		var elem=this.UIDocument.getElementById(fld)
		if (!elem) return;
		var msg=this.getMessage();
		try {
			elem.focus();
			elem.select();
		} catch (e) { }
		
		if (elem.getAttribute("type").toLowerCase()!="button")
			this.formWnd.lawformTextFocus(elem);
			
		this.setMessage(msg)
	} catch(e) { }
}
LawFormObj.prototype.positionInFieldById=function(elemName,rowNbr)
{
	try {
		var idItem=this.formWnd.idColl.getItem(elemName)
		if (idItem)
		{
			var fld=idItem.fld
			var pos=fld.indexOf("r")
			// id collection only holds 'r0' fields
			if(typeof(rowNbr)!="undefined" && pos > 0)
				fld=fld.replace(/r0/g, "r"+rowNbr)
			this.positionInField(fld);
		}
	} catch(e) { }
}
LawFormObj.prototype.positionInFirstField=function(bForce)
{
	bForce = (typeof(bForce) == "boolean" ? bForce : false);
	if (this.formWnd.formState.agsError && !bForce)
		return;
	var fld=this.findFirstField();
	if (!fld) 
		frmPositionInToolbar()
	else
		this.positionInField(fld.id)
}
LawFormObj.prototype.positionInTransfers=function()
{
	this.portalObj.tabArea.selectFirst();
}
LawFormObj.prototype.pushFormWindow=function(strTKN,strPDL,strHKEY,strCustID)
{
	try {
		// must have a token
		if (!strTKN || typeof(strTKN) == "undefined" || strTKN == "")
			return;

		// other parms will default
		strPDL = (!strPDL || typeof(strPDL) == "undefined" || strPDL == "" 
			? this.formWnd.strPDL : strPDL);
		strHKEY = (!strHKEY || typeof(strHKEY) == "undefined" || strHKEY == "" ? null : strHKEY);
		strCustID = (!strCustID || typeof(strCustID) == "undefined" || strCustID == "" ? null : strCustID);

		// build xpress call and open pushed window
		var source=this.formWnd.portalWnd.frmBuildXpressCall(strTKN,strPDL,"modal",strHKEY,strCustID);
		this.formWnd.lawformPushWindow(source);

	} catch (e) { }
}
LawFormObj.prototype.showFieldInfo=function(fld)
{
	var msg="";
	try {
		var mElement=this.UIDocument.getElementById(fld);
		msg=mElement.getAttribute("nm");
		if (!msg) return;
		var tmp=mElement.getAttribute("id");
		if (tmp) msg += (" | Id="+tmp);
		tmp=this.formWnd.idColl.getItemByFld(mElement.getAttribute("id").replace(/r\d+/,"r0"));
		if (tmp) msg += (" | CustomId="+tmp.id);
		tmp=mElement.getAttribute("knb");
		if (tmp) msg += (" | KNb="+tmp+"");
		tmp=mElement.getAttribute("tp");
		if (tmp) msg += (" | Type="+tmp);
		tmp=mElement.getAttribute("edit");
		if (tmp) msg += (" | Edit="+tmp);
		tmp=mElement.getAttribute("maxlength");
		if (tmp && tmp < 1000) msg += (" | Size="+tmp);
		tmp=mElement.getAttribute("maxsize");
		if (tmp) msg += (" | Max="+tmp);
		tmp=mElement.getAttribute("decsz");
		if (tmp) msg += (" | Dec="+tmp);
		tmp=mElement.getAttribute("name");
		if (tmp) msg += (" | Name="+tmp);
		tmp=mElement.getAttribute("par");
		if (tmp) msg += (" | Parent="+tmp);
		tmp=mElement.getAttribute("defval");
		if (tmp) msg += (" | DefVal="+tmp);
		tmp=mElement.getAttribute("xltis");
		if (tmp) msg += (" | XLT="+tmp);
		tmp=mElement.getAttribute("tran");
		if (tmp) msg += (" | Tran="+tmp);
		tmp=mElement.getAttribute("attcmt");
		if (tmp) msg += (" | AttCmt="+tmp);
		tmp=mElement.getAttribute("atturl");
		if (tmp) msg += (" | AttUrl="+tmp);
		tmp=mElement.getAttribute("altref");
		if (tmp) msg += (" | AltRef="+tmp);
	} catch(e) { msg=""; }
	this.setMessage(msg)
}

// end lawson form object and methods
//-----------------------------------------------------------------------------

//start lawson collection objects
//-----------------------------------------------------------------------------
function LawDefaultColl()
{
	this.length=0;
	this.defFlds=new Array();
	this.fldIndex=new Object();
}
LawDefaultColl.prototype.addItem=function(fieldId,defVal,detail,isxlt,par)
{
	var i=this.defFlds.length;
	var keyItem;

	keyItem=new Object();
	keyItem.fld=fieldId;
	keyItem.defval=defVal;
	keyItem.det = detail ? detail : null;
	keyItem.isxlt = isxlt ? true : false;
	keyItem.par = par ? par : "";

	this.defFlds[i]=keyItem;
	this.length=this.defFlds.length;

	//mount item to field index
	this.fldIndex[fieldId]=i;
}
LawDefaultColl.prototype.children=function(index)
{
	if(arguments.length==0)
		return this.defFlds;
	return this.defFlds[index];
}
LawDefaultColl.prototype.getItem=function(fieldId)
{
	var index;

	index=this.fldIndex[fieldId];
	if(typeof(index)=="undefined")
		return null;

	return this.defFlds[index];
}
//-----------------------------------------------------------------------------
function LawNameColl()
{
	this.length=0;
	this.names=new Array();
	this.fldIndex=new Object();
	this.namIndex=new Object();
}
LawNameColl.prototype.addItem=function(fld,nm,fldbtn,par,det,tp,oc)
{
	var i=this.names.length;
	var keyItem;

	keyItem=new Object();
	keyItem.fld=fld;
	keyItem.nm=nm;
	keyItem.fldbtn=fldbtn;
	keyItem.par=par;
	keyItem.det=det;
	keyItem.type=tp;
	keyItem.oc=oc;

	this.names[i]=keyItem;
	this.length=this.names.length;

	//mount item to field index and name index
	this.fldIndex[fld]=i;
	this.namIndex[nm]=i;
}
LawNameColl.prototype.children=function(index)
{
	if(arguments.length==0)
		return this.names;
	return this.names[index];
}
LawNameColl.prototype.getItem=function(fld)
{
	var index;

	index=this.fldIndex[fld];
	if(typeof(index)=="undefined")
		return null;

	return this.names[index];
}
LawNameColl.prototype.getNameItem=function(nm)
{
	var index;

	index=this.namIndex[nm];
	if(typeof(index)=="undefined")
		return null;

	return this.names[index];
}
//-----------------------------------------------------------------------------
function LawIdColl()
{
	this.length=0;
	this.ids=new Array();
	this.idIndex=new Object();
	this.fldIndex=new Object();
}
LawIdColl.prototype.addItem=function(fld,id)
{
	var i=this.ids.length;
	var keyItem;

	keyItem=new Object();
	keyItem.fld=fld;
	keyItem.id=id;

	this.ids[i]=keyItem;
	this.length=this.ids.length;

	//mount item to field index
	this.idIndex[id]=i;
	this.fldIndex[fld]=i;
}
LawIdColl.prototype.children=function(index)
{
	if(arguments.length==0)
		return this.ids;
	return this.ids[index];
}
LawIdColl.prototype.getItem=function(id)
{
	var index=this.idIndex[id];
	if(typeof(index)=="undefined")
		return null;
	return this.ids[index];
}
LawIdColl.prototype.getItemByFld=function(fld)
{
	var index=this.fldIndex[fld];
	if(typeof(index)=="undefined")
		return null;
	return this.ids[index];
}
//-----------------------------------------------------------------------------
function LawListColl()
{
	this.length=0;
	this.reqFlds=new Array();
	this.fldIndex=new Object();
}
LawListColl.prototype.addItem=function(fieldId,pos,label,keynbr,deftkn,tp)
{
	var i=this.reqFlds.length;
	var keyItem;

	if(typeof(deftkn)=="undefined" || deftkn=="")
		deftkn=null;

	keyItem=new Object();
	keyItem.fld=fieldId;
	keyItem.pos=pos;
	keyItem.label=label;
	keyItem.keynbr=keynbr;
	keyItem.priority=1;
	keyItem.deftkn=deftkn;
	keyItem.tp=tp;
	keyItem.data="";
	keyItem.keyflds=null;

	this.reqFlds[i]=keyItem;
	this.length=this.reqFlds.length;

	//mount item to field index
	this.fldIndex[fieldId]=i;
}
LawListColl.prototype.children=function(index)
{
	if(arguments.length==0)
		return this.reqFlds;
	return this.reqFlds[index];
}
LawListColl.prototype.getItem=function(fieldId)
{
	var index;

	index=this.fldIndex[fieldId];
	if(typeof(index)=="undefined")
		return null;

	return this.reqFlds[index];
}
//-----------------------------------------------------------------------------
function LawRequiredColl()
{
	this.length=0;
	this.reqFlds=new Array();
	this.fldIndex=new Object();
}
LawRequiredColl.prototype.addItem=function(fieldId,keynbr,req,nextreq,key,size,edit,det)
{
	var i=this.reqFlds.length;
	var keyItem;

	if(typeof(keynbr)=="undefined")
		keynbr="";
	if(typeof(req)=="undefined")
		req="";
	if(typeof(nextreq)=="undefined")
		nextreq="";
	if(typeof(key)=="undefined")
		key="";
	if(typeof(det)=="undefined")
		det="";

	keyItem=new Object();
	keyItem.fld=fieldId;
	keyItem.keynbr=keynbr;
	keyItem.req=req;
	keyItem.nextreq=nextreq;
	keyItem.key=key;
	keyItem.size=size;
	keyItem.edit=edit;
	keyItem.det=det;

	this.reqFlds[i]=keyItem;
	this.length=this.reqFlds.length;

	//mount item to field index
	this.fldIndex[fieldId]=i;
}
LawRequiredColl.prototype.children=function(index)
{
	if(arguments.length==0)
		return this.reqFlds;
	return this.reqFlds[index];
}
LawRequiredColl.prototype.getItem=function(fieldId)
{
	var index;

	index=this.fldIndex[fieldId];
	if(typeof(index)=="undefined")
		return null;

	return this.reqFlds[index];
}
//-----------------------------------------------------------------------------
function LawDetailColl()
{
	this.length=0;
	this.detailFlds=new Array();
	this.fldIndex=new Object();
}
LawDetailColl.prototype.addItem=function(fldNbr,rows,par)
{
	var i=this.detailFlds.length;
	var detailItem;

	if(typeof(fldNbr)=="undefined")
		fldNbr="";
	if(typeof(rows)=="undefined")
		rows="";
	if(typeof(par)=="undefined")
		par="";

	detailItem=new Object();
	detailItem.fldNbr=fldNbr;
	detailItem.rows=rows;
	detailItem.par=par;

	this.detailFlds[i]=detailItem;
	this.length=this.detailFlds.length;

	//mount item to field index
	this.fldIndex[fldNbr]=i;
}
LawDetailColl.prototype.children=function(index)
{
	if(arguments.length==0)
		return this.detailFlds;
	return this.detailFlds[index];
}
LawDetailColl.prototype.getItem=function(fldNbr)
{
	var index;

	index=this.fldIndex[fldNbr];
	if(typeof(index)=="undefined")
		return null;

	return this.detailFlds[index];
}
//-----------------------------------------------------------------------------
function LawWorkflowColl()
{
	this.length = 0;
	this.workflows = new Array();
	this.fcIndex = new Object();
}
LawWorkflowColl.prototype.addItem=function(service, system, subSystem, categoryValue, fc)
{
	var i = this.workflows.length;
	var workflow = new Workflow(service, system, subSystem, categoryValue, fc);
	
	if(workflow)
	{
		this.workflows[i] = workflow;
		this.length = this.workflows.length;
		this.fcIndex[fc] = i;
		return workflow;
	}
	return null;
}
LawWorkflowColl.prototype.children=function(index)
{
	if(arguments.length==0)
		return this.workflows;
		
	return this.workflows[index];
}
LawWorkflowColl.prototype.getItem=function(fc)
{
	var index = this.fcIndex[fc];
	
	if(typeof(index)=="undefined")
		return null;

	return this.workflows[index];
}

//----------------------------------------------------------------------------
function ActionFrameworkService(portalWnd)
{
	this.portalWnd=portalWnd;
	var oXML = portalWnd.SSORequest(this.portalWnd.lawsonPortal.formsDir + "/actionframework.xsl");
	this.oXSL=portalWnd.objFactory.createInstance("DOM");
	this.oXSL.async=false;
	this.oXSL.loadXML(oXML.xml);
	if (this.oXSL.parseError.errorCode!=0)
		alert(this.oXSL.parseError.reason+this.oXSL.parseError.srcText);
}
//----------------------------------------------------------------------------
ActionFrameworkService.prototype.loadForm=function(actionFrameworkCall)
{
	// object is used by all forms and XML here is simply the last one built
	/*
	var parms=this.portalWnd.getVarFromString("_PARMS",xpressCall);
	this.tkn=this.portalWnd.getVarFromString("_TKN",xpressCall);
	this.id=this.portalWnd.getVarFromString("_ID",xpressCall);
	this.rootdir=this.portalWnd.getXpressParm("rootdir",parms);
	this.mode=this.portalWnd.getXpressParm("mode",parms);
	this.pdl=this.portalWnd.getXpressParm("pdl",parms);
	this.hk=this.portalWnd.getXpressParm("hkey",parms);
	this.host=this.portalWnd.getXpressParm("host",parms);
	this.uselists=this.portalWnd.getXpressParm("uselists",parms);
	this.iosVersion=this.portalWnd.getXpressParm("iosVersion",parms);;
	this.status=null;
	*/
	this.jobName = this.portalWnd.getVarFromString("jobName", actionFrameworkCall);
	this.jobOwner = this.portalWnd.getVarFromString("jobOwner", actionFrameworkCall);
	this.jobStepNumber = this.portalWnd.getVarFromString("jobStepNumber", actionFrameworkCall);
	
	var myXML=null;
	// use form from local cache?
	/*
	
	if (this.portalWnd.oFormCache
	&& this.portalWnd.oUserProfile.useFormCache())
		myXML=this.portalWnd.oFormCache.getFormObject(this.pdl,this.tkn,this.id);
	*/
	if (!myXML)
	{
		// call Xpress and check return status
		//var api="/servlet/Xpress"+xpressCall;
		var api="/lawson-ios/action/ParameterScreen" + actionFrameworkCall + "&section=form";
		myXML=this.portalWnd.SSORequest(api,null,"","",false);
		var errMsg="Servlet Xpress reported:\n";
		if (this.portalWnd.oError.isErrorResponse(myXML,true,true,true,errMsg))
		{
			this.errMsg="Unable to load requested form: PDL="+this.pdl+", TKN="+this.tkn;
			this.status=(myXML && myXML.status ? myXML.status : null);
			return null;
		}
		if (this.portalWnd.oFormCache
		&& this.portalWnd.oUserProfile.useFormCache())
			this.portalWnd.oFormCache.saveForm(this.pdl,this.tkn,this.id,myXML.xml);
	}

	try {
		// set root node attributes for XSL processing
		var frmNode=myXML.selectSingleNode("//FORM")
		frmNode.setAttribute("jobName",this.jobName);
		frmNode.setAttribute("jobOwner",this.jobOwner);
		frmNode.setAttribute("jobStepNumber",this.jobStepNumber);
		//frmNode.setAttribute("rootdir",this.rootdir);
		//frmNode.setAttribute("mode",this.mode);
		//frmNode.setAttribute("pdl",this.pdl);
		//frmNode.setAttribute("hkey",this.hk);
		//frmNode.setAttribute("host",this.host);
		//frmNode.setAttribute("uselists",this.uselists);
		//frmNode.setAttribute("iosVersion",this.iosVersion);

	} catch (e) { 
		var prefix="Error loading form XML:\n";
		this.portalWnd.oError.displayExceptionMessage(e,FORMSFORMUTILJS,"loadForm",prefix);
		this.errMsg="Unable to load requested form: PDL="+this.pdl+", TKN="+this.tkn;
		this.status=(myXML && myXML.status ? myXML.status : null);
		myXML=null;
	}
	return  myXML
}

//-----------------------------------------------------------------------------
ActionFrameworkService.prototype.buildForm=function(myXML)
{
	var formHTM=""
	xmlDoc=myXML
	xslDoc=this.oXSL
	
	if(!xmlDoc.status)
		formHTM=xmlDoc.transformNode(xslDoc)
	return formHTM
}

//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
function IEFormService(portalWnd)
{
	this.portalWnd=portalWnd;
	var oXML = portalWnd.SSORequest(this.portalWnd.lawsonPortal.formsDir + "/lawform.xsl");
	this.oXSL=portalWnd.objFactory.createInstance("DOM");
	this.oXSL.async=false;
	this.oXSL.loadXML(oXML.xml);
	if (this.oXSL.parseError.errorCode!=0)
		alert(this.oXSL.parseError.reason+this.oXSL.parseError.srcText);
}
//-----------------------------------------------------------------------------
IEFormService.prototype.loadForm=function(xpressCall)
{
	// object is used by all forms and XML here is simply the last one built
	var parms=this.portalWnd.getVarFromString("_PARMS",xpressCall);
	this.tkn=this.portalWnd.getVarFromString("_TKN",xpressCall);
	this.id=this.portalWnd.getVarFromString("_ID",xpressCall);
	this.rootdir=this.portalWnd.getXpressParm("rootdir",parms);
	this.mode=this.portalWnd.getXpressParm("mode",parms);
	this.pdl=this.portalWnd.getXpressParm("pdl",parms);
	this.hk=this.portalWnd.getXpressParm("hkey",parms);
	this.host=this.portalWnd.getXpressParm("host",parms);
	this.uselists=this.portalWnd.getXpressParm("uselists",parms);
	this.iosVersion=this.portalWnd.getXpressParm("iosVersion",parms);;
	this.status=null;

	// use form from local cache?
	var myXML=null;
	if (this.portalWnd.oFormCache
	&& this.portalWnd.oUserProfile.useFormCache())
		myXML=this.portalWnd.oFormCache.getFormObject(this.pdl,this.tkn,this.id);

	if (!myXML)
	{
		// call Xpress and check return status
		var api="/servlet/Xpress"+xpressCall;
		myXML=this.portalWnd.SSORequest(api,null,"","",false);
		var errMsg="Servlet Xpress reported:\n";
		if (this.portalWnd.oError.isErrorResponse(myXML,true,true,true,errMsg))
		{
			this.errMsg="Unable to load requested form: PDL="+this.pdl+", TKN="+this.tkn;
			this.status=(myXML && myXML.status ? myXML.status : null);
			return null;
		}
		if (this.portalWnd.oFormCache
		&& this.portalWnd.oUserProfile.useFormCache())
			this.portalWnd.oFormCache.saveForm(this.pdl,this.tkn,this.id,myXML.xml);
	}

	try {
		// set root node attributes for XSL processing
		var frmNode=myXML.selectSingleNode("//form")
		frmNode.setAttribute("rootdir",this.rootdir);
		frmNode.setAttribute("mode",this.mode);
		frmNode.setAttribute("pdl",this.pdl);
		frmNode.setAttribute("hkey",this.hk);
		frmNode.setAttribute("host",this.host);
		frmNode.setAttribute("uselists",this.uselists);
		frmNode.setAttribute("iosVersion",this.iosVersion);

	} catch (e) { 
		var prefix="Error loading form XML:\n";
		this.portalWnd.oError.displayExceptionMessage(e,FORMSFORMUTILJS,"loadForm",prefix);
		this.errMsg="Unable to load requested form: PDL="+this.pdl+", TKN="+this.tkn;
		this.status=(myXML && myXML.status ? myXML.status : null);
		myXML=null;
	}
	return  myXML
}
//-----------------------------------------------------------------------------
IEFormService.prototype.loadPreview=function()
{
	// instantiate our own DOM object to protect
	// against version mismatch with Design Studio
	try {
		var myXML=this.portalWnd.objFactory.createInstance("DOM");
		myXML.loadXML(this.portalWnd.lawsonPortal.preview.XMLDocument.xml);

		this.tkn="";
		this.id="";
		this.rootdir=this.portalWnd.lawsonPortal.path;
		this.mode="notmodal";
		this.pdl="";
		this.hk="";
		this.host="portal";
		this.uselists="";
		this.iosVersion=this.portalWnd.oPortalConfig.getShortIOSVersion();

		var frmNode=myXML.selectSingleNode("//form");
		frmNode.setAttribute("rootdir",this.rootdir);
		frmNode.setAttribute("mode",this.mode);
		frmNode.setAttribute("hkey","");
		frmNode.setAttribute("host",this.host);
		frmNode.setAttribute("iosVersion",this.iosVersion);

	} catch (e) { 
		myXML=null;
		var prefix="Error loading preview XML:\n";
		this.portalWnd.oError.displayExceptionMessage(e,FORMSFORMUTILJS,"loadPreview",prefix);
	}
	return  myXML
}
//-----------------------------------------------------------------------------
IEFormService.prototype.buildTab=function(tabID,oXML)
{
	var tabHTM=""
	xmlDoc=oXML
	xslDoc=this.oXSL
	tabNode=xmlDoc.selectSingleNode("//tab[@nbr='" + tabID + "']")
	tabHTM=tabNode.transformNode(xslDoc)
	tabHTM=tabHTM.substring(tabHTM.indexOf(">")+1,tabHTM.length)
	tabHTM=tabHTM.substring(0,tabHTM.lastIndexOf("</div>"))
	return tabHTM
}
//-----------------------------------------------------------------------------
IEFormService.prototype.buildForm=function(myXML)
{
	var formHTM=""
	xmlDoc=myXML
	xslDoc=this.oXSL
	
	if(!xmlDoc.status)
		formHTM=xmlDoc.transformNode(xslDoc)
	return formHTM
}

//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
function LawFieldScroll(portalWnd,formWnd)
{
	this.id=null;
	this.idaCall=null;
	this.value=null;
	this.mode=null;
	this.isSelect=null;
	this.portalWnd=portalWnd;
	this.formWnd=formWnd;
	this.nextItem=null;
	this.prevItem=null;
}

//-----------------------------------------------------------------------------
LawFieldScroll.prototype.scroll=function(mElement,mode)
{
	if (!mElement || !mElement.id) return;
	this.mode=mode;
	this.portalWnd.edPerformEdits(mElement);
	if (mElement.id != this.id || portalWnd.trim(mElement.value) != portalWnd.trim(this.value))
	{
		this.id=mElement.id;
		this.value=mElement.value;
		this.isSelect=(mElement.getAttribute("tp")=="text");
		this.nextItem=null;
		this.prevItem=null;
	}

	var adjacentItem=(this.mode=="next") ? this.nextItem : this.prevItem;
	if (this.isSelect)
	{
		if (adjacentItem==null)
			this.find(mElement.getAttribute("knb"));
		else
			this.findAdjacent(adjacentItem);
	}
	else
	{
		if (adjacentItem==null)
			this.ddFind();
		else
			this.ddFindAdjacent(adjacentItem);
	}
}

//-----------------------------------------------------------------------------
LawFieldScroll.prototype.find=function(keynbr)
{
	var fld=this.id.replace(/r\d+/,"r0");
	var idaCall=this.idaCall 
		? this.idaCall
		: this.formWnd.frmMakeIDAString("SL", fld, keynbr);
	var xmlDoc=this.issueIdaCall(idaCall + "&_RECSTOGET=1");
	if (!xmlDoc) return;

	var idaNode=xmlDoc.document.getElementsByTagName("IDACALL")[0];
	if (!idaNode) return;
	if (idaNode.getAttribute("type")=="SL")
	{
		for (var i=0; i<idaNode.childNodes.length; i++)
		{
			if (idaNode.childNodes[i].nodeType==4)
			{
				idaCall=idaNode.childNodes[i].nodeValue;
				break;
			}
		}
		var xmlDoc=this.issueIdaCall(idaCall + "&_RECSTOGET=1");
		if (!xmlDoc) return;
	}

	var keyFind=xmlDoc.document.getElementsByTagName("KEYFIND")[0];
	if (!keyFind) return;

	var sel=keyFind.getAttribute("fieldname");
	if (!sel) return;

	var	strOperand = (this.mode == "next" ? ">=" : "<=");
	var find = "&_FF=" + sel + strOperand + this.value;		
	
	var xmlDoc=this.issueIdaCall(idaCall + find + "&_RECSTOGET=1");
	if (!xmlDoc) return;

	this.nextItem=null; 
	var findNext=xmlDoc.document.getElementsByTagName("NEXTPAGE")[0];
	if (findNext)
	{
		for (var i=0; i<findNext.childNodes.length; i++)
		{
			if (findNext.childNodes[i].nodeType==4)
			{
				this.nextItem=findNext.childNodes[i].nodeValue;
				break;
			}
		}
	}

	this.prevItem=null; 
	var findPrev=xmlDoc.document.getElementsByTagName("PREVPAGE")[0];
	if (findPrev)
	{
		for (var i=0; i<findPrev.childNodes.length; i++)
		{
			if (findPrev.childNodes[i].nodeType==4)
			{
				this.prevItem=findPrev.childNodes[i].nodeValue;
				break;
			}
		}
	}

	var keysNode=xmlDoc.document.getElementsByTagName("KEYFLDS")[0];
	this.formWnd.lawformDrillSel(keysNode, true);
	if (this.value==this.formWnd.lawForm.getElementValue(this.id))
	{
		var idaCall=(this.mode=="next") ? this.nextItem : this.prevItem;
		if (idaCall)
			this.findAdjacent(idaCall);
	}
	else
		this.value=this.formWnd.lawForm.getElementValue(this.id);
}

//-----------------------------------------------------------------------------
LawFieldScroll.prototype.findAdjacent=function(idaCall)
{
	var xmlDoc=this.issueIdaCall(idaCall);
	if (!xmlDoc) return;

	var findNext=xmlDoc.document.getElementsByTagName("NEXTPAGE")[0];
	if (findNext)
	{
		for (var i=0; i<findNext.childNodes.length; i++)
		{
			if (findNext.childNodes[i].nodeType==4)
			{
				this.nextItem=findNext.childNodes[i].nodeValue;
				break;
			}
		}
	}

	var findPrev=xmlDoc.document.getElementsByTagName("PREVPAGE")[0];
	if (findPrev)
	{
		for (var i=0; i<findPrev.childNodes.length; i++)
		{
			if (findPrev.childNodes[i].nodeType==4)
			{
				this.prevItem=findPrev.childNodes[i].nodeValue;
				break;
			}
		}
	}

	var keysNode=xmlDoc.document.getElementsByTagName("KEYFLDS")[0];
	this.formWnd.lawformDrillSel(keysNode, true);
	this.value=this.formWnd.lawForm.getElementValue(this.id);
}

//-----------------------------------------------------------------------------
LawFieldScroll.prototype.ddFind=function()
{
	var vals=frmGetFieldValueList(this.formWnd, this.id);
	if (vals.length==1 && vals[0].getAttribute("Disp").indexOf(":")!=-1)
	{
		if (this.value.length==0)
		{
			var range=vals[0].getAttribute("disp").split(":");
			this.formWnd.lawForm.setElementValue(this.id, range[0]);
			this.value=this.formWnd.lawForm.getElementValue(this.id);
			this.formWnd.lawformApplyXLTValue(this.id)
			this.nextItem=null;
			this.prevItem=null;
		}
	}
	else
	{
		var i=0;
		var item="";
		var re=new RegExp("^"+this.value);
		while (i<vals.length && item.length==0)
		{
			if (vals[i].getAttribute("disp").search(re)!=-1)
			{
				item=vals[i].getAttribute("disp");
				this.nextItem=(vals.length>i+1) ? i+1 : i;
				this.prevItem=(i-1>0) ? i-1 : 0;
			}
			i++;
		}

		if (item.length==0)
		{
			item=vals[0].getAttribute("disp");
			this.nextItem=(vals.length>1) ? 1 : 0;
			this.prevItem=0;
		}

		if (item.indexOf(":")!=-1)
		{
			var range=item.split(":");
			item=range[0];
		}

		if (item==this.value)
		{
			var adjItem=(this.mode=="next") ? this.nextItem : this.prevItem;
			this.ddFindAdjacent(adjItem);
		}
		else
		{
			this.formWnd.lawForm.setElementValue(this.id, item);
			this.value=this.formWnd.lawForm.getElementValue(this.id);
			this.formWnd.lawformApplyXLTValue(this.id);
		}
	}
}

//-----------------------------------------------------------------------------
LawFieldScroll.prototype.ddFindAdjacent=function(index)
{
	var vals=frmGetFieldValueList(this.formWnd, this.id);
	if (index>=vals.length) return;
	if (vals[index].getAttribute("disp").indexOf(":")!=-1)
		var item=vals[index].getAttribute("disp").split(":")[0];
	else
		var item=vals[index].getAttribute("disp");

	this.formWnd.lawForm.setElementValue(this.id, item);
	this.value=this.formWnd.lawForm.getElementValue(this.id);
	this.formWnd.lawformApplyXLTValue(this.id);
	this.nextItem=(vals.length>index+1) ? index+1 : index;
	this.prevItem=(index-1>0) ? index-1 : 0;
}

//-----------------------------------------------------------------------------
LawFieldScroll.prototype.issueIdaCall=function(idaCall)
{
	var idaAPI=this.formWnd.strIDAPath+idaCall.substr(idaCall.indexOf("?"), idaCall.length);
	var xmlDoc=this.portalWnd.SSORequest(idaAPI,null,"","",false);

//todo: new message	
	var msg=this.portalWnd.lawsonPortal.getPhrase("ERROR_LOAD_XML")+"\n";
	this.portalWnd.oError.setMessage(msg);
	return (this.portalWnd.oError.isErrorResponse(xmlDoc,true,true,false,msg,this.formWnd)
		? null 
		: this.portalWnd.oError.getDSObject());
}
//-----------------------------------------------------------------------------
LawFieldScroll.prototype.setIDACall=function(idaCall)
{
	this.idaCall=idaCall;
}

//-----------------------------------------------------------------------------
function CRTIODataObj()
{
	this.customId="";
	this.Request="";
	this.Screen="";
	this.PassXlt="";
	this.DspXlt="";
	this.Message="";

}
CRTIODataObj.prototype.setValue=function(propName,value)
{
	var execString=""
	var valType=typeof(value)
	switch(valType)
	{
		case "string":
			execString="this." + propName + "='" + value + "'"
			break
		case "object":
		case "boolean":
		default:
			execString="this." + propName + "=" + value
			break
	}
	try{
		eval(execString)
	}
	catch(e){}
	return true
}
