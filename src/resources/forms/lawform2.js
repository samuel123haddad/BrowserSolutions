//*****
//** Modificacoes para suporte a chrome/firefox
//*********************************************

var portalWnd=null;
var portalObj=null;
var configObj=null;

var pageWnd=null;
var pageObj=null;
var helpWnd=null;
var dragObj=new Object();

var tranMagic=null;
var formState=null;
var lastControl=null;
var lawForm=null;
var oDropDown=null;
var frmElement=null;
var oHelp=null;
var oWizard=null;
var fieldScroll=null;

var bFormUnloading=false;
var bPushedForm=false;
var bNewHelpNotFound=false;

var frmhostXML=null
var httpIDA=null;
var rulesFieldId="";
var rulesFieldDet="";
var rulesKeyRow=0;
var agsReturn=""
var tbButtonName="LAWTBBUTTONtbBtn"
var hiddenMap = null;
var doDefSwitch = 0;

var oFeedBack=null
var utilWindowState=new Object()
utilWindowState.currentState="MAXIMIZED"

var batchBtnNames=new Array("SUBMIT","REPORTS","JOB-SCHEDULER","PRINT-MANAGER");
var batchFldNames= new Array("JOB-NAME","USER-NAME","PRODUCT-LINE");
var batchRoleNames= new Array("","","allow_jobschedule","allow_printfiles");
var LAWFORMJS="forms/lawform2.js"		// filename constant for error handler


function hideDropDown()
{
	// Verificar se esta na sequencia certa.
	if (portalWnd.oBrowser.isIE) {
		if (oDropDown != null && oDropDown.isVisible && oDropDown.dropDownClick > 0)
			oDropDown.hide();
		else if (oDropDown != null && oDropDown.isVisible)
			oDropDown.dropDownClick++;
	}
}

//-----------------------------------------------------------------------------
function lawformOnLoad(evt)
{
	// Pelo redesenho esta num nivel superior esta variavel
	if (! frmhostXML)
		frmhostXML = parent.frmhostXML;
	portalWnd=envFindObjectWindow("lawsonPortal",window);
	if (!portalWnd) return;
	if (!portalWnd.lawsonPortal || typeof(portalWnd.lawsonPortal)=="undefined")
		return;
	portalObj=portalWnd.lawsonPortal;
	configObj=portalWnd.oPortalConfig;
	strAGSPath=portalWnd.AGSPath;
	strIDAPath=portalWnd.IDAPath;

	// load the script versions
	envLoadWindowScriptVersions(portalWnd.oVersions,window,portalWnd);

	if (strHost=="page")
	{
		// get reference to PortalPage window
		pageWnd=envFindObjectWindow("page",window);
		if (!pageWnd)
			pageWnd = (typeof(parent.pageWnd) != "undefined" ? parent.pageWnd : parent);

		// get reference to PortalPage object
		// (may not always have one since we sometimes "spoof" page behavior)
		pageObj=(parent.pageObj 
			? parent.pageObj 
			: (typeof(parent.page) != "undefined" ? parent.page : null));
	}
		
	// load the form messages XML (one time)
	if (!portalWnd.erpPhrases)
		portalWnd.erpPhrases=new portalWnd.phraseObj("forms")

	// get a reference to the form span and its attributes
	// custom form? can only be id'd 'form1'
	// (something better needed in this case!)
	frmElement=document.getElementById("form1")
	if (!frmElement)
		frmElement=document.getElementById("form")
	if (!frmElement)
	{
		try {
			alert(portalWnd.erpPhrases.getPhrase("ERR_LOADING_FORM")+strPDL+" "+strTKN)
		} catch (e) { }
		return;
	}

	// check for no direct transfer
	if ( (frmElement.getAttribute("NOTKNXFER")=="1")
	&& !portalObj.previewMode
	&& (!strTKN.match(portalWnd.flowRE)) && (strMode=="notmodal") )
	{
   		if (portalObj.keyBuffer
   		&& portalObj.keyBuffer.state
   		&& portalObj.keyBuffer.state.doTransfer)
			// internal form transfer, ignore
			;
		else
		{
			try {
				var msg1=strTitle+" ("+strTKN+")";
				var msg2=portalWnd.erpPhrases.getPhrase("ERR_XFER_NOT_ALLOWED");
				if (configObj.isPortalLessMode())
					portalWnd.displayErrorPage(portalWnd,msg1+"%n"+msg2);
				else
				{
					portalWnd.cmnDlg.messageBox(msg1+"\n"+msg2+"\n","ok","alert",window);
				portalWnd.goBack();
				}
			} catch (e) { }
			return;
		}
	}

	// disable the context menu
	document.oncontextmenu = nsNoContextMenu
	document.onclick = nsOnClick

	// instantiate form state object
	formState=new portalWnd.FormStateObj();

	// instantiate a form object
	lawForm = new portalWnd.LawFormObj(portalWnd,window);
	lawForm.IEXML=frmhostXML

	lawForm.fldAdvance = portalWnd.oUserProfile.getPreference("fieldadvance")=="1" ? true : false;
	lawForm.useShortDate = portalWnd.oUserProfile.getPreference("useshortdate")=="1" ? true : false;

	// instantiate the data magic object
	tranMagic = new portalWnd.Magic(window,portalWnd)
	lawForm.magic=tranMagic;

	// instantiate a field scroll object
	fieldScroll = new portalWnd.LawFieldScroll(portalWnd,window);

	// create feedback object
	oFeedBack = new FeedBack(window,portalWnd);

	// load the hotkeys
	portalObj.keyMgr.addHotkeySet("forms","forms",portalWnd.erpPhrases);

	// check for custom initialization script
	if(typeof(FORM_OnInit)=="function")
		FORM_OnInit()

	// now initialize magic
	if (!lawForm.magic.initialize())
	{
		var msg=portalWnd.erpPhrases.getPhrase("ERR_FORM_MAGICINIT") +
			"\nPDL = "+strPDL+"; TKN  = "+strTKN;
		portalWnd.cmnDlg.messageBox(msg,"ok","stop",window);
		return;
	}

	// initialize any tabregions (must be after magic init which
	// calls the xslBuildCollections method)
	lawformInitTabs();

	// check for additional custom initialization script
	if(typeof(FORM_OnAfterDataInit)=="function")
		FORM_OnAfterDataInit()

	// to use list driven:
	// 1) check the user preference setting
	// 2) must have some required fields
	// 3) must be a 'non-modal' form? (ie. not a pushed form and not a portal page)
	// 4) no hidden key value passed to form
	// 5) portal not in preview mode
	// 6) all the required fields must have a label attribute
	// 7) form was not opened as a 'doDefine' request
	// 8) no agsError during initialization
	lawForm.useLists=( portalWnd.oUserProfile.getPreference("uselist")=="1"
		&& listColl.reqFlds.length > 0 && strMode=="notmodal") ? true : false;
	if (strHost.toLowerCase()=="page") lawForm.useLists=false
	if(lawForm.isBatchForm) lawForm.useLists=false
	if (strHKValue!="") lawForm.useLists=false
	if (portalObj.previewMode) lawForm.useLists=false

	// are any required fields missing a label?
	var bMissingLabels=false
	if (lawForm.useLists)
	{
		for (var i = 0; i < listColl.reqFlds.length; i++)
		{
			if (listColl.reqFlds[i].label=="")
			{
				bMissingLabels=true
				break;
			}
		}
	}
	if (bMissingLabels) lawForm.useLists=false;

	// field help on?
 	lawForm.fldHelp = portalWnd.oUserProfile.getPreference("fieldhelp")=="1" ? true : false;
 	if (portalObj.previewMode) lawForm.fldHelp=false
 	// on a pushed form, use caller's field help setting
 	if (parent.lawForm)
 		lawForm.fldHelp = parent.lawForm.fldHelp

	// are we here based on previous form request to doDefine?
	var bDoDefine=false
	if (keyColl.keyBuffer)
		bDoDefine=keyColl.keyBuffer.state.doDefine
	if (bDoDefine) lawForm.useLists=false;
	if (formState.agsError) lawForm.useLists=false;

	// perform framework initialization (depends on useLists setting)
 	xslInitFramework();		// function built in XSL

	// reset the form state
	formState.setValue("doDefine",false)
	formState.setValue("doPush",false)
	formState.setValue("doTransfer",false)
	formState.setValue("skipInitialTxn",false)
	formState.setValue("selectDetailRow",false)
	lawformOnResize()

	if (lawForm.useLists)
		// send to list driven with required field collection
		lawformShowList(true);
	else
	{
		if(strMode == "modal")
			lawForm.magic.setTabSecurity();

		if(formState.agsError)
			lawForm.magic.processError()
		else if (!strHKValue || strHKValue.substr(0,9) != "_JOBPARAM")
			lawForm.positionInFirstField()

		if (keyColl.keyBuffer && keyColl.keyBuffer.state.crtio.Request == "MANUALCFKEY"
		&& keyColl.keyBuffer.state.crtio.Message != "")
			lawForm.setMessage(keyColl.keyBuffer.state.crtio.Message);
	}
	// wizard preview?
	if (portalObj.previewMode && portalObj.preview.wizPreview)
	{
		oWizard=new Wizard(portalWnd, window, strPDL, strTKN);
		oWizard.preview(portalObj.preview.wizXml);
	}
}

//-----------------------------------------------------------------------------
function lawformInitBatchToken()
{
	// be sure we're a batch token
	// (only called from xslInitFramework)
	if (!lawForm.isBatchForm) return;

	var mElement=null;
	var fname="";
	var len=0;

	// coming from jobs, reports screen to view/update job parameters ---------
	if (strHKValue && strHKValue.substr(0,9)=="_JOBPARAM")
	{
		if (formState.agsError)		// possible security error on inquiry?
		{
			portalObj.toolbar.changeButtonState("tbBtnChg","disabled");
			return;
		}

		// hide batch special buttons
		len=batchBtnNames.length;
		for (var i = 0; i < len; i++)
		{
			fname = namColl.getNameItem(batchBtnNames[i]).fld;

			//allow Report button			
			if(fname == "_f4") continue;
		
		   	mElement=lawForm.getElement(fname);
			if (mElement && mElement.parentNode)
				mElement.disabled = true;
		}
		
		// protect job name, user name, pdl, etc
		len=batchFldNames.length;
		for (var i = 0; i < len; i++)
		{
			fname = namColl.getNameItem(batchFldNames[i]).fld;
		   	mElement=lawForm.getElement(fname);
			if (mElement)
			{
				mElement.disabled=true;
				mElement=document.getElementById("SELBUTTON"+fname);
				if (mElement) mElement.style.visibility="hidden";
			}
		}
		lawForm.positionInField("_f8");
		return;
	}

	// standard batch token, not open as Parameters change --------------------

	// test for role restrictions
	len=batchRoleNames.length;
	for (var i = 2; i < len; i++)
	{
		if (configObj.getRoleOptionValue(batchRoleNames[i],"0")!= "1")
		{
			fname = namColl.getNameItem(batchBtnNames[i]).fld;
		   	mElement=lawForm.getElement(fname);
			if (mElement && mElement.parentNode)
				mElement.parentNode.style.visibility="hidden";
		}		
	}

	// add job list 'form transfer'?
	if (configObj.getRoleOptionValue("allow_joblist","0")== "1")
	{
		aFormLink[aFormLink.length]="FC= JL ";
		aFormLinkText[aFormLinkText.length]=portalObj.getPhrase("LBL_JOBS_REPORTS");
	}
}
//-----------------------------------------------------------------------------
function firstChildElement(parent) {
	var node = parent.firstChild;
	while (node) {
		if (node && node.nodeType == 1)
			return node;
	}
}

//-----------------------------------------------------------------------------
// must position the active tab bottom border when tabregion initially painted
// ...and paint a 'more' tab if all the tabs cannot be displayed.
function lawformInitTabs(trId)
{
	for (tr in aTabRgns)
	{
		var rgnStore=aTabRgns[tr];

		// a trId means we have just painted a new tab for an
		// already initialized region...so we can skip it
		if (typeof(trId) != "undefined" && tr == trId)
			continue;

		var nbrTabs=rgnStore.length;
		var nTRWidth=0;
		var nBtnsWidth=0;
		var bDropBtnInserted=false;
		var tabContainer=null;
		var dropTab=null;
		var nDropTabWidth=0;

		for (var i = 0; i < nbrTabs; i++)
		{
			var tabStore=rgnStore.children(i);
			var tabBtn=document.getElementById(tabStore.name);
			if (!tabBtn) break;					// tab not painted
			if (!tabBtn.offsetWidth) break;		// region not visible

			if (nTRWidth==0)					// get TR width
			{
				tabContainer=tabBtn.parentNode;
				if (!tabContainer) break;		// shouldn't happen
				nTRWidth=tabContainer.offsetWidth;
			}

			// create drop tab element (only 1 time)
			dropTab=(dropTab ? dropTab : lawformCreateDropTab(tr));

			// problem: dropTab has no width until it is properly positioned,
			// so we have to assume a width of 23 pixels;
			nDropTabWidth=(nDropTabWidth 
				? nDropTabWidth 
				:(dropTab && dropTab.offsetWidth ? dropTab.offsetWidth : 23));

			// do we have room to display this button?
			if ( bDropBtnInserted
			|| ( (nBtnsWidth+tabBtn.offsetWidth) > nTRWidth )
			|| ( i < (nbrTabs-1) && (nBtnsWidth+tabBtn.offsetWidth) > (nTRWidth-nDropTabWidth) ) )
			{
				tabBtn.style.display="none";
				if (!bDropBtnInserted)
				{
					tabContainer.appendChild(dropTab);
					dropTab.style.right=(nTRWidth-nBtnsWidth-nDropTabWidth)+"px";
					bDropBtnInserted=true;
				}
				continue;
			}
			else
				tabContainer.setAttribute("lastVisible",tabStore.name);
			nBtnsWidth+=tabBtn.offsetWidth;

			// is tab disabled?
			if (firstChildElement(tabBtn).disabled)
				continue;

			if (!tabBtn.className || tabBtn.className != "activeTab")
				continue;
			var tabPane=document.getElementById(tabStore.name+"PANE")
			if (!tabPane) break;

			var imgBottom=window.document.getElementById("imgTabBottom"+
				(tabPane.getAttribute("isSubPane") == "1" ? tr : ""));
			imgBottom.style.left=tabBtn.offsetLeft+1;
			imgBottom.style.width=tabBtn.offsetWidth-2;
		}
	}
}
//-----------------------------------------------------------------------------
// create tab button for button overflow condition
function lawformCreateDropTab(trId)
{
	var dropTab=window.document.createElement("div");
	dropTab.id=trId+"dropDiv";
	dropTab.name=trId;
	dropTab.className="dropTab";
	dropTab.onclick=lawformShowDropTab;

	var strHTML="<button id=\""+ trId+"dropBtn" +
			"\" title=\""+portalWnd.erpPhrases.getPhrase("lblShowMoreTabs")+"\" " +
			"onmouseover=\"this.className='tabButtonOver'\" " +
			"onmouseout=\"this.className=''\">&nbsp;</button>" +
			"<img src=\""+portalObj.path+"/images/ico_toolbutton_more.gif\" " +
			"style=\"position:absolute;left:4px;top:8px;\" />"

	dropTab.innerHTML=strHTML;
	return dropTab;
}

//-----------------------------------------------------------------------------
// onclick handler for 'more' tabs
function lawformShowDropTab(evt)
{
	if (!formState.formReady) return;	// form disabled

	lastControl=firstChildElement(this);
	window.setTimeout("lawformDoShowDropTab('"+this.id+"')",100);
	evt=portalWnd.getEventObject(evt,window);
	portalWnd.setEventCancel(evt);
}

//-----------------------------------------------------------------------------
function lawformDoShowDropTab(id)
{
	var rgnStore=aTabRgns[id.substr(0,3)];
	if (!rgnStore) return;		// shouldn't happen

	if (!oDropDown)
		oDropDown=new Dropdown();
	oDropDown.clearItems();

	var nbrTabs=rgnStore.length;
	var selItem="";
	for (var i = 0; i < nbrTabs; i++)
	{
		var tabStore=rgnStore.children(i);
		if (tabStore.value == "1")		// secured
			continue;
		var tabBtn=window.document.getElementById(tabStore.name);
		if (tabBtn.style.display != "none")
			continue;		// it's visible
		if (tabBtn.className && tabBtn.className == "activeTab")
			selItem=tabStore.name;
		var title=firstChildElement(tabBtn).getAttribute("title");
		var text=firstChildElement(tabBtn).innerHTML;
		var val=tabStore.name;
		oDropDown.addItem((title ? title : text),val);
	}
	oDropDown.show(selItem, lastControl, "lawformDropTabSel");
}
//-----------------------------------------------------------------------------
// callback for drop tab dropdown list
function lawformDropTabSel(value)
{
	var mElement=lastControl
	mElement.focus()
	if (value!=null)
		frmSwitchTab(window,document.getElementById(value))
}

//-----------------------------------------------------------------------------
// Netscape specific handlers
function nsNoContextMenu()
{
	return (false);
}
function nsOnClick(e)
{
	var event=portalWnd.getEventObject(e)
	if (event.button=="2")		// right button
	{
		portalWnd.frmShowContextMenu(event,window,event.target)
		return (false);
	}
}

//-----------------------------------------------------------------------------
// cancel select fired on a button
function lawformOnBtnSelect(evt)
{
    // don't do a select on a button: it highlights the text
	evt=portalWnd.getEventObject(evt)
	if (!evt) return

	var mElement=portalWnd.getEventElement(evt)
	if (!mElement) return;

	if (mElement.nodeName.toLowerCase()=="button")
	{
   		portalWnd.setEventCancel(evt);
		return (false);
	}
	if (mElement.nodeName.toLowerCase()=="input")
	{
		if (mElement.getAttribute("type")=="button")
		{
   			portalWnd.setEventCancel(evt);
			return (false);
		}
	}
}

//-----------------------------------------------------------------------------
// something baaad happened in the XML/XSL
function lawformLoadError()
{
	portalWnd=envFindObjectWindow("lawsonPortal",window);
	if (!portalWnd) return;

	var msg=window.document.getElementById("errText").innerHTML
	if (msg.length > 0)
	{
		msg=msg.replace(/&/g,"\n\&");
		msg+="\n\n";
		portalWnd.cmnDlg.messageBox(msg,"ok","stop",window);
	}

	if (strHost.toLowerCase()=="page") return;
	portalWnd.goBack();
}

//-----------------------------------------------------------------------------
// form is unloading (can't be stopped!)
function lawformOnUnload(evt)
{
	// note: refresh causes this to fire inappropriately in IE!

	if(typeof(FORM_OnTerminate)=="function")
		FORM_OnTerminate()

	// has the portal unload method fired?
	if (portalObj==null)
		return;

	try {
		if (helpWnd && !helpWnd.closed)
			helpWnd.close();
		if (formState.crtio.Request!="EXITWINDOW")
		{
			formState.pushFromRow=false
			keyColl.buildKeyBuffer()
			parent.lawForm.fldHelp = lawForm.fldHelp;
		}
	 } catch(e){}

	// tell framework (or if pushed form, tell parent) to clear our stuff
	if (parent==portalWnd) bFormUnloading=true
	if (typeof(parent.formUnload) == "function")
		parent.formUnload(true);

	// be sure we cleanup memory on the way out!
	try {

		keyColl.keyBuffer=null;

		lawForm=null;
		tranMagic=null;
		formState=null;
		oDropDown=null;
		oHelp=null;
		oWizard=null;
		keyColl=null;
		reqColl=null;
		listColl=null;
		pushColl=null;
		defColl=null;
		namColl=null;
		idColl=null;
	} catch (e) { }
}

//-----------------------------------------------------------------------------
// called by a pushed form unloading (same function name as on portal)
// (also called by a portal page hosting a form)
function formUnload(bLeavePageTab)
{
	bLeavePageTab = (typeof(bLeavePageTab)!="boolean" ? false : bLeavePageTab);
	var agsReq="";

	if ( ! window.bFormUnloading && ! window.bPushedForm )
	{
		xslInitFramework();

		var bDispMsg=false
		var msg=""
		if(portalObj.keyBuffer)
		{
			agsReq=portalObj.keyBuffer.state.crtio.Request;
			if (agsReq!="EXITWINDOW" && agsReq!="MANUALCFKEY" && agsReq!="")
				keyColl.consumeBuffer(true)

			switch(agsReq)
			{
			case "RETURNKNS":
				bDispMsg=true;
				msg=keyColl.keyBuffer.state.crtio.Message
				lawForm.magic.txnHK=lawForm.magic.buildHK(false)				
				break;
			case "RTNKNS_MANCF":
				bDispMsg=false
				lawformPushWindow(portalWnd.frmBuildXpressCall(keyColl.keyBuffer.state.crtio.Screen, strPDL,
					"modal", null, keyColl.keyBuffer.state.crtio.customId, null, null, strHost))
				break;
			case "EXECCALLER":
				bDispMsg=true;
				lawForm.magic.setFormData();
				lawForm.magic.transact(keyColl.keyBuffer.state.crtio.PassXlt, true)
				msg=lawForm.getMessage()
				break;
			default:
				bDispMsg=true;
				break;
			}
		}
		if(lastControl && lastControl.style.visibility != "hidden" && agsReq != "EXECCALLER" )
			lastControl.focus()
		else
			lawForm.positionInFirstField()
			

		if (bDispMsg) lawForm.setMessage(msg)

		// is there custom script for post-CRTIO 'data exchange'?
		try {
			if (typeof(FORM_OnAfterDataExchange) == "function" && agsReq != "")
				FORM_OnAfterDataExchange(keyColl.keyBuffer.state.crtio)
		} catch (e) { }
	}
	else
	{
		// nested pushes must call portal unload
		// (don't call if portal page)
		if (strHost != "page")
			portalWnd.formUnload(bLeavePageTab);
	}
}

//-----------------------------------------------------------------------------
function lawformGoHome()
{
	portalWnd.goHome()
}

//-----------------------------------------------------------------------------
function lawformDoFunctionClick(evt)
{
// fired by click of toolbar button to perform DoFunction
	try {
		if (!formState.formReady) return;

	    evt = portalWnd.getEventObject(evt);
	    if (!evt) evt = portalWnd.getEventObject(evt,window);
	    if (!evt) return;
	    
	    // invalid date check
		if (lastControl && lastControl.value != ""
		&& lastControl.getAttribute("edit") == "date")
		{
			var edVal = lastControl.value;
			portalWnd.edPerformEdits(lastControl);
			if (lastControl.value == "")
			{
				lastControl.value = edVal;
				lastControl.focus();
				return;
			}
		}			   	    

		var mElement=portalWnd.getEventElement(evt)
		var func=mElement.getAttribute("userdata")
		if (func)
			lawformDoFunction(func)

	} catch (e) { }
}
//-----------------------------------------------------------------------------
function lawformDoFunctionFromHotkey(func, mElement)
{
	// if 'DoFunction' invoked from a hotkey,
	// insure that field validation/edits performed
	// against the field with focus
	
	// check form strValidFCs to see if valid
	if(!portalWnd.frmIsValidFc(window,func))
 		return
 
	if (mElement)
	{
		var tp=mElement.getAttribute("tp")
		if (tp && tp!="push")
		{
			var val = lawForm.getElementValue(mElement.id);
			if (val && val.length > 0)
			{  
				portalWnd.edPerformEdits(mElement)
				if (mElement.getAttribute("edit")=="date")
				{
					var edVal = lawForm.getElementValue(mElement.id)
					if (!edVal)
					{
						mElement.focus();
						mElement.value= val;
						return;
					}
				}
			}
		}
	    if (mElement.getAttribute("hasrule") == "1")
        {
            var rowNbr = (mElement.id.lastIndexOf("r") > 0)
                ? formState.currentRow
                : -1;
		    lawformCallRules(mElement.id, rowNbr);
        }
	}
	lawformDoFunction(func)
}

//-----------------------------------------------------------------------------
function lawformDoFunction(func)
{
 	// pending rules call?
	if (httpIDA && httpIDA.doneState==0)
	{
		window.setTimeout("lawformDoFunction('"+func+"')",100)
		return;
 	}

	// get description of transaction
	var tranName = ""+func;
	var len=aFormFC.length;
	for (var i = 0; i < len; i++)
	{
		if (aFormFC[i] != func)
			continue;
		tranName=aFormFCText[i];
		break;
	}

	// put up busy message
	var msg = lawForm.getPhrase("PROCESSING");
	if (tranName.length > 1 ) msg+=" "+tranName;
	msg+="...";
	lawForm.setMessage(msg)

	// check form FC pairs to see if valid
 	if (portalWnd.frmEvalFCPairs(window, func) == false)
 		return;

	// check for confirmation requirement
	var dblXmit=frmElement.getAttribute("dblXmit")
	var fcExp = (func.search(/^[a-zA-Z]/) != -1
		? func
		: "\\" + func); 
	var re = new RegExp("(" + fcExp + "$|" + fcExp + ";)");
	if(dblXmit && dblXmit.search(re)!=-1)
	{
		var msg = (func.length==1 
				? lawForm.getPhrase("CONFIRM_OK_TO1")
				: lawForm.getPhrase("CONFIRM_OK_TO2") + " " + func);
		if (!confirm(msg))
	    {
			lawForm.setMessage("");
	     	return;
	    } 
	}

	// let magic happen!
	oFeedBack.show();
	setTimeout("lawformDoFunction2('"+func+"')", 50);
}

//-----------------------------------------------------------------------------
function lawformDoFunction2(func)
{
	formState.autoCompleteFC=func
	if ( lawForm.magic.transact(func) )
	{
        lawformSetStartVal(lastControl);
		formState.autoCompleteFC="";
		lawForm.positionInFirstField();
	}
	oFeedBack.hide();
}

//-----------------------------------------------------------------------------
function lawformDoFieldScroll(id,mode)
{
	fieldScroll.scroll(document.getElementById(id),mode)
	oFeedBack.hide();
}

//-----------------------------------------------------------------------------
function lawformIncTabPage(mElement,inc)
{
	try {
		var par=mElement.getAttribute("par")
		if (!par || par=="")
		{
			if (mElement.getAttribute("isTabLabel") != "1")
				return
			par=mElement.getAttribute("id").replace("BTN","");
		}

		var pane=document.getElementById(par+"PANE")
		if (!pane)
		{
			var tmp=document.getElementById(par)
			if (tmp)
			{
				par=tmp.getAttribute("name")
				pane=document.getElementById(par+"PANE")
			}
		}
		// if mElement not on tab pane return
		if (!pane) return

		// look at tagregion storage object		
		var rgnId=pane.getAttribute("name");
		var rgnStore=aTabRgns[rgnId];
		var nbrTabs=rgnStore.length;
		var curIndex=rgnStore.index[par];
		var i = curIndex+inc;
		if (i < 0 || i > (nbrTabs-1))
			return;

		// find a tab that's not secured
		while (rgnStore.items[i].value == "1")
		{
			i += inc;
			if (i < 0 || i > (nbrTabs-1))
				return;
		}

		// iterate up/down storage for next enabled tab pane
		var curPane=rgnStore.items[i].name;
		var htmPane=document.getElementById(curPane+"PANE");
		var htmBtn=document.getElementById(curPane+"BTN");
		while ( htmPane )
		{
			if (htmPane.className.substr(0,15)=="tabPaneDisabled" || htmBtn.disabled)
			{
				i += inc;
				if (i < 0 || i > (nbrTabs-1))
					break;
				curPane=rgnStore.items[i].name;
				htmPane=document.getElementById(curPane+"PANE");
				htmBtn=document.getElementById(curPane+"BTN");
				continue;
			}
			var htmRgn=htmPane.parentNode;
			if (!htmRgn) return;
			frmSwitchTab(window,document.getElementById(curPane))
			htmPane=null
		}
	} catch (e) {
		portalWnd.oError.displayExceptionMessage(e,LAWFORMJS,"lawformIncTabPage","",window);
	}
}

//-----------------------------------------------------------------------------
function lawformMoveToSubTabPage(mElement,inc)
{
	try {
		var detName=mElement.getAttribute("det")
		if (!detName || detName=="") return

		var dtlArea=document.getElementById(detName)
		if (!dtlArea) return

		var tabrgn=document.getElementById(dtlArea.getAttribute("tabregion"))
		if (!tabrgn) return;

		if ( inc < 0 )	// move into sub-tab from detail
		{
			var curtab=tabrgn.getAttribute("curtab")
			if (!curtab || curtab=="") return;

			// find the active tab and set focus
			portalWnd.frmPositionInFirstTabField(window,document.getElementById(curtab+"PANE"))
		}
		else	// move from sub-tab to detail
		{
			// must be on a tab
			var dtlRowElm=document.getElementById(detName+"ROW"+formState.currentRow)
			if (!dtlRowElm) return;
			var inpFlds=dtlRowElm.getElementsByTagName("INPUT")
			var i;
			for (i = 0; i < inpFlds.length; i++)
			{
				if (inpFlds[i].getAttribute("type").toLowerCase()!="hidden")
					break;
			}
			lawForm.positionInField(inpFlds[i].id);
		}
	} catch (e) { 
		portalWnd.oError.displayExceptionMessage(e,LAWFORMJS,"lawformMoveToSubTabPage","",window);
	}
}

//-----------------------------------------------------------------------------
function lawformOnKeyPress(evt)
{
	// ignore key events when form has not yet finished initializing
    evt = portalWnd.getEventObject(evt)
    if (!evt) return;

	var mElement=portalWnd.getEventElement(evt)
	if (!formState.formReady)
	{
		portalWnd.setEventCancel(evt)
		return false
	}
	lawForm.setMessage("");
}

//------------------------------------------------------------------------------
function lawformOnKeyDown(evt)
{
    evt = portalWnd.getEventObject(evt)
    if (!evt) return false;

	// is form locked from input?
	if (!formState.formReady)
	{
		portalWnd.setEventCancel(evt)
		return
	}
	lawForm.setMessage("");

	// enter key on tab drop button?
	var mElement=null;
	if (!evt.altKey && !evt.ctrlKey && !evt.shiftKey && evt.keyCode == 13)
	{
		mElement=portalWnd.getEventElement(evt);
		if ((""+mElement.getAttribute("id")).substr(3) == "dropBtn")
		{
			mElement.click();
			portalWnd.setEventCancel(evt);
			return;
		}
	}

	// want to 'hide' this feature -- no hotkey defined (ctrl+alt+A or ctrl+shft+V)
	if (evt.altKey && evt.ctrlKey && !evt.shiftKey && evt.keyCode == 65
	|| !evt.altKey && evt.ctrlKey && evt.shiftKey && evt.keyCode == 86)
	{
		lawformShowMagic();
		portalWnd.setEventCancel(evt);
		return;
	}

	// check with portal for hotkey action
	var action = portalWnd.getFrameworkHotkey(evt,"forms");
	if ( !action )
	{
		// framework handled the keystroke
		portalWnd.setEventCancel(evt);
		return;
	}

	// it's safe to clear agsError (otherwise, some hotkeys may not function)
	formState.agsError=false;

	// see if active wizard wants to handle
	if (oWizard && oWizard.isVisible)
	{
		// wizard key events
		if(oWizard.cntxtActionHandler(evt,action))
		{
			portalWnd.setEventCancel(evt);
			return;
		}
	}

	// hotkey defined for this keystroke
	if (action != "forms")
	{
		if (cntxtActionHandler(evt,action))
		{
			portalWnd.setEventCancel(evt);
			return;
		}
	}

	// advance to next field?
	if (lawForm.fldAdvance)
	{
		try {
			mElement = lawformGetNextElement(evt);
			if (mElement)
				window.setTimeout("lawformMoveToNextField('"+mElement.id+"')",5);
		} catch (e) { }
	}
}

//-----------------------------------------------------------------------------
function cntxtActionHandler(evt,action)
{
	if (action==null)		// called by the portal
	{
		// if form has pushed windows open, route to them
		if (window.frames.length > 0 &&
		typeof(window.frames[0].cntxtActionHandler)=="function")
			return (window.frames[0].cntxtActionHandler(evt,null));

		action = portalWnd.getFrameworkHotkey(evt,"forms");
		if (!action || action=="forms")
			return false;
	}

	if (typeof(FORM_OnKeyDown)=="function")
	{
		try	{
			if (!FORM_OnKeyDown(evt,action))
				return true;
		} catch (e) { }
	}

	var bHandled=false;
	var mElement=portalWnd.getEventElement(evt)
	var tp=mElement.getAttribute("tp")

	switch (action)
	{
	case "doSubmit":
		lawformDoDefaultFC(null,mElement);
		bHandled=true
		break;
	case "doCancel":
		// on a pushed form (not a flowchart), go back
		if (strMode == "modal" && parent.bPushedForm && !strTKN.match(portalWnd.flowRE))
		{
			bHandled=true
			if(portalWnd.oBrowser.isIE)
				lawformPopWindow();
			else					
				setTimeout("lawformPopWindow()",100);
		}
		else if (strHKValue && strHKValue.substr(0,9) == "_JOBPARAM")
		{
			var closeBtn=portalWnd.document.getElementById("LAWTBBUTTONbtnCloseForm");
			if (closeBtn)
				closeBtn.click();
		}
		break;
	case "doClearAll":
		lawForm.magic.clearFormData()
		bHandled=true
		break;
	case "doClearFld":
		lawForm.setElementValue(mElement.id,"")
		bHandled=true
		break;
	case "doClearToEnd":
		lawForm.magic.clearFormData(mElement.id)
		bHandled=true
		break;
	case "doContextMenu":
		portalWnd.frmShowContextMenu(null, window, mElement)
		bHandled=true
		break;
	case "doCopyDetail":
		lawformCopyDetailField(mElement)
		bHandled=true
		break;
	case "doCopyDetailInv":
		lawformCopyDetailField(mElement,-1)
		bHandled=true
		break;
	case "doFieldHelp":
		portalWnd.frmToggleFieldHelp(window, mElement.id)
		bHandled=true
		break;
	case "doFieldNext":
		if (!tp) return (false);
		if (tp=="text" && mElement.getAttribute("hsel")=="1" && mElement.getAttribute("knb")
		|| tp=="select" || tp=="fc")
		{
			oFeedBack.show();
			setTimeout("lawformDoFieldScroll('"+mElement.id+"','next')", 50);
			bHandled=true
		}
		break;
	case "doFieldPrev":
		if (!tp) return (false);
		if (tp=="text" && mElement.getAttribute("hsel")=="1" && mElement.getAttribute("knb")
		|| tp=="select" || tp=="fc")
		{
			oFeedBack.show();
			setTimeout("lawformDoFieldScroll('"+mElement.id+"','previous')", 50);
			bHandled=true
		}
		break;
	case "doFormHelp":
		lawformFormHelp()
		bHandled=true
		break;
	case "doFuncAdd":
      	lawformDoFunctionFromHotkey("A", mElement)
		bHandled=true;
		break;
	case "doFuncChg":
      	lawformDoFunctionFromHotkey("C", mElement)
		bHandled=true;
		break;
	case "doDelete":
      	lawformDoFunctionFromHotkey("D", mElement)
		bHandled=true;
		break;
	case "doFuncInq":
      	lawformDoFunctionFromHotkey("I", mElement)
		bHandled=true;
		break;
	case "doNext":
      	lawformDoFunctionFromHotkey("N", mElement)
		bHandled=true;
		break;
	case "doPrev":
      	lawformDoFunctionFromHotkey("P", mElement)
		bHandled=true;
		break;
	case "doPageDn":
      	lawformDoFunctionFromHotkey("+", mElement)
		bHandled=true;
		break;
	case "doPageUp":
      	lawformDoFunctionFromHotkey("-", mElement)
		bHandled=true;
		break;
	case "doMoveOffDetail":
		lawformMoveToSubTabPage(mElement,-1)
		bHandled=true
		break;
	case "doMoveToDetail":
		lawformMoveToSubTabPage(mElement,1)
		bHandled=true
		break;
	case "doOpenField":
		if (!tp) return (false);
		if (tp=="text")
		{
			if (mElement.getAttribute("hsel") == "1")
			{
				portalWnd.frmDoSelect(window, mElement.getAttribute("knb"), mElement.id)
				bHandled=true
			}
			else if (mElement.getAttribute("edit") == "date")
			{
				portalWnd.frmShowCalendar(window, mElement.id)
				bHandled=true
			}
		}
		else if (tp=="select" || tp=="fc")
		{
			// timing issue with Netscape
			setTimeout("lawformDoShowDropDown('" + mElement.id + "')", 0);
			bHandled=true
		}
		else if (tp=="push")
		{
			mElement.click();
			bHandled=true;
		}
		break;
	case "doRowNext":
		if (!tp) return (false);
		var par=mElement.parentNode;
		if ( !par || par.className != "detailRowActive")
			return (false);
		var rows=parseInt(document.getElementById(formState.currentDetailArea).getAttribute("rows"))
		var row=parseInt(par.getAttribute("rowIndex"))
		if (row!=rows-1)
		{
			document.getElementById(mElement.id.replace(/r\d+/,"r"+(row+1))).focus()
			bHandled=true
		}
		break;
	case "doRowPrev":
		if (!tp) return (false);
		var par=mElement.parentNode;
		if ( !par || par.className != "detailRowActive")
			return (false);
		var row=parseInt(par.getAttribute("rowIndex"))
		if (row!=0)
		{
			document.getElementById(mElement.id.replace(/r\d+/,"r"+(row-1))).focus()
			bHandled=true
		}
		break;
	case "doTabPageDn":
		lawformIncTabPage(mElement,1)
		bHandled=true
		break;
	case "doTabPageUp":
		lawformIncTabPage(mElement,-1)
		bHandled=true
		break;
	case "openNewWindow":
		if (frmElement.getAttribute("NOTKNXFER") == "0")
		{
			var parms=("?_TKN=" + strTKN);
			if (configObj.isPortalLessMode())
				parms+="&RUNASTOP=0";
			portalWnd.newPortalWindow(parms);
		}
		bHandled=true;
		break;
	case "posInFirstField":
		lawForm.setMessage("")		// clear message so we don't restore
        lawForm.positionInFirstField(true)
		bHandled=true
		break;
	case "posInFCSelect":
		var fcElem=portalWnd.document.getElementById("LAWTBBUTTONactions")
		if (fcElem) fcElem.focus();
		bHandled=true
		break;
	case "showAttachments":
		var obj = portalWnd.frmAllowAttachment(window, mElement);
		if (obj.retVal)
		{
			portalWnd.frmDoAttachments(window, mElement.getAttribute("knb"), mElement.id);
			bHandled = true;
		}
		else if (obj.isProper)
			portalObj.setMessage(portalObj.getPhrase("FIELDREQUIRED"));
		break;
	case "showDefine":
		portalWnd.frmDoDefine(window, mElement.getAttribute("deftkn"), mElement.id)
		lawformTextBlur(mElement)
		doDefSwitch = 1
		bHandled=true
		break;
	case "showDrill":
		var obj = portalWnd.frmAllowDrill(window, mElement);
		if (obj.retVal)
		{
			portalWnd.frmDoDrill(window, mElement.getAttribute("knb"), mElement.id);
			bHandled = true;
		}
		else if (obj.isProper)
			portalObj.setMessage(portalObj.getPhrase("FIELDREQUIRED"));
		break;
	case "showFieldInfo":
		lawForm.showFieldInfo(mElement.id)
		bHandled=true
		break;
	case "showWizard":
		portalWnd.frmDoWizard(window, strTKN)
		bHandled=true
		break;
	}
	return(bHandled)
}

//-----------------------------------------------------------------------------
function lawformDoShowDropDown(id)
{
	portalWnd.frmShowDropDown(window, id);
}

//-----------------------------------------------------------------------------
function lawformOnHelp(e)
{
	// only IE fires this -- do we want to cancel?
	var evt=window.event
	if ( portalObj.keyMgr.cancelHelpKey(evt,"forms") )
		portalWnd.setEventCancel(evt)
}

//-----------------------------------------------------------------------------
function lawformFormHelp(useOldHelp)
{
	if(!portalWnd.portalIsUserSSOActive(true))
	{
		portalWnd.portalLogout();
		return false;
	}
	
	var filePath = "";
	try	{
		if (lastControl)
		{
			lastControl.focus();
			lastControl.select();
		}
	} catch (e)	{}

	useOldHelp = (typeof(useOldHelp) == "boolean" ? useOldHelp : false);
	if (useOldHelp || bNewHelpNotFound)
	{
		// first time new help not found always use old help (for this form)
		bNewHelpNotFound=true;
		portalWnd.formWnd=window;

		// if push window opened, send this on
		if (window.frames.length > 0 &&
		typeof(window.frames[0].lawformFormHelp)=="function")
		{
			window.frames[0].lawformFormHelp(true);
			return;
		}

		if (helpWnd && !helpWnd.closed)
			helpWnd.focus();
		else
			// called after new help call failed
			helpWnd=portalWnd.open(portalObj.formsDir + "/formhelp.htm", "_blank",
				"left="+(screen.width-640)+",height=600,width=620,status=no,resizable=yes");
	}
	else
	{
		var language = portalObj.getLanguage();
		var pdl=strPDL.toLowerCase();
		var idx = strTKN.indexOf(".");
		filePath = pdl+"/"+(idx == -1
				? strTKN.toUpperCase() + ".xml" 
				: strTKN.substr(0, idx) + "_" + strTKN.substr(idx+1) + ".xml");
		var domainName = portalWnd.getDomainName();
		var api="/servlet/Help?_LANG=" + language;
			api += (domainName) ? "&_DOMAIN=" + domainName : "";
			api += "&_FILE=" + filePath + "&_PARMS=rootdir|"+portalObj.path + "||onerror|portalHelpError||";
		if (portalWnd.helpWnd && !portalWnd.helpWnd.closed && portalWnd.lastHelp == strTKN)
			portalWnd.helpWnd.focus();
		else if (portalWnd.helpWnd && !portalWnd.helpWnd.closed)
		{
			portalWnd.lastHelp=strTKN;
			portalWnd.helpWnd.navigate(api);
			portalWnd.helpWnd.focus();
		}
		else
		{
			portalWnd.lastHelp=strTKN;
			portalWnd.helpWnd = portalWnd.open(api, "_blank",
				"top=5,left=5000,width=560,height=" + (screen.height-100) + 
				",status=no,resizable=yes,scrollbars=no");
			setTimeout("lawformFormHelpReposition()", 900);
		}
	}
}

//-----------------------------------------------------------------------------
function lawformFormHelpReposition()
{
	if (portalWnd.helpWnd && !portalWnd.helpWnd.closed)
	{
		var leftScreen = (portalWnd.oBrowser.isIE)
			? portalWnd.helpWnd.screenLeft 
			: portalWnd.helpWnd.screenX ;
		if (leftScreen >= 5000)
			// IE only? appears NS will not position offscreen
			portalWnd.helpWnd.moveBy((screen.width-5575), 0);
	}
}

//-----------------------------------------------------------------------------
// menu item callback
function lawformFieldHelp()
{
	try{
		if (!lastControl)
			lastControl=document.activeElement
		if (!lastControl) return;
		portalWnd.frmToggleFieldHelp(window, lastControl.id)
		lastControl.focus()
		lastControl.select()
	} catch (e) { }
}

//-----------------------------------------------------------------------------
// menu item callback
function lawformWizardHelp()
{
	portalWnd.frmDoWizard(window, strTKN)
	if (!oWizard || !oWizard.isVisible)
	{
		if (lastControl)
		{
			lastControl.focus()
			lastControl.select()
		}
	}
}

//-----------------------------------------------------------------------------
// menu item callback
function lawformShowGuideMe()
{
	// launch the guide me
	window.open("/lawson/learning/guideme/html/"+strTKN+".htm");
}

//-----------------------------------------------------------------------------

function lawformOnResize(evt)
{
	try {
		var scrWidth=(portalWnd.oBrowser.isIE
			? document.body.offsetWidth
			: window.innerWidth);
		var scrHeight=(portalWnd.oBrowser.isIE
			? document.body.offsetHeight
			: window.innerHeight);

		var mainDiv=document.getElementById("mainDiv")
		if (!mainDiv) return;
		var utilFrame=document.getElementById("utilFrame")
		if (!utilFrame) return;
		var utilContainer=document.getElementById("utilContainer")
		if (!utilContainer) return;

		if (oFeedBack && typeof(oFeedBack.resize) == "function")
			oFeedBack.resize();

		var formToolbar=document.getElementById("formtoolbar")
		if (!formToolbar)
		{
			// standard form: move me only if I'm not a pushed window or
			// I'm a pushed window that's not detached (maximized)
			if (typeof(parent.bPushedForm) != "boolean"
			|| (typeof(parent.bPushedForm) == "boolean" && utilWindowState.currentState=="MAXIMIZED"))
			{
				mainDiv.style.top=0;
				mainDiv.style.left=0;
				if (scrWidth > 16)
				{
					mainDiv.style.width=scrWidth;
					mainDiv.style.height=scrHeight;
				}
			}
		}
		else
		{
			// portal page: always resize me
			var bPageIsMax=(pageObj ? pageObj.state.maximized : false);
			formToolbar.style.top=0;
			formToolbar.style.left=0;
			formToolbar.style.width=scrWidth-(bPageIsMax?10:0);

			mainDiv.style.top=formToolbar.offsetHeight;
			mainDiv.style.left=0;
			mainDiv.style.width=scrWidth-(bPageIsMax?10:0);
			mainDiv.style.height=scrHeight-formToolbar.offsetHeight;

			if (typeof(parent.bPushedForm) == "boolean")
				setTimeout("parent.lawformOnResize()",10);
		}

		// both: resize my util containers if I'm not hosting a pushed form or
		// I am hosting a pushed form and it's not detached (maximized)
		if (!bPushedForm || utilWindowState.currentState=="MAXIMIZED")
		{
			utilContainer.style.top=0;
			utilContainer.style.left=0;
			utilContainer.style.width=scrWidth;
			utilContainer.style.height=scrHeight;

		 	utilFrame.style.top=0;
		 	utilFrame.style.left=0;
		 	utilFrame.style.width=scrWidth;
		 	utilFrame.style.height=scrHeight;
		}
		
	} catch (e) {
		portalWnd.oError.displayExceptionMessage(e,LAWFORMJS,"lawformOnResize","",window)
	}
}

//-----------------------------------------------------------------------------
function lawformTextFocus(mElement)
{
	if(!formState.formReady)
	{
		portalWnd.frmPositionInToolbar();
		return;
	}	
	
	//need to use onfocus because onblur and onclick events happen simultaneously.
	if(!lawformCheckValueAgainstList(lastControl))
		return;
		
	var rowNbr = -1
	try	{
		var elemId=mElement.id
		var pos=elemId.lastIndexOf("r")
		if (pos > 0)
		{
			portalWnd.frmSetActiveRow(window, mElement)
			rowNbr=formState.currentRow
			elemId=elemId.substr(0,pos)+"r0"
		}

		// is there custom script for the onfocus?
		var tp=mElement.getAttribute("tp").toLowerCase()
		if (tp=="text")
		{
			if(typeof(TEXT_OnFocus)=="function")
			{
				var txtItem=idColl.getItemByFld(elemId)
				if( !TEXT_OnFocus(txtItem.id,rowNbr) )
					return
			}
		}
		else if (tp=="select" || tp=="fc") //PT 183102 - include tp "fc"
		{
			if(typeof(VALUES_OnFocus)=="function")
			{
				var valItem=idColl.getItemByFld(elemId)
				if( !VALUES_OnFocus(valItem.id,rowNbr) )
					return
			}
		}
	} catch (e) { }

	mElement.setAttribute("startval", rowNbr == -1 ?
				lawForm.getElementValue(mElement.id) : lawForm.getElementValue(mElement.id,rowNbr) )
	if (lawForm.fldHelp)
 		portalWnd.frmShowFieldHelp(window, mElement.id);
 	mElement.className="textBoxHighLight"
	var elemValue = portalWnd.trim(mElement.getAttribute("startval"))
	if(elemValue != "")
		mElement.select()

	lastControl=mElement
	formState.setValue("currentField",mElement.id)
}

//-----------------------------------------------------------------------------
function lawformTextBlur(mElement)
{
	if(mElement.getAttribute("prevDecValue"))
		mElement.setAttribute("prevDecValue", "");
	
	if(!lawformCheckValueAgainstList(mElement))
		return;
	
	// check for invalid data
	var val = lawForm.getElementValue(mElement.id);
	if (val && val.length > 0)
	{  
		portalWnd.edPerformEdits(mElement);
		if (mElement.getAttribute("edit") == "date")
		{
			var edVal = lawForm.getElementValue(mElement.id);
			if (edVal == "")
			{
				mElement.value = val;
				return;
			}
		}
	}
		
	// is there custom script for the onblur?
	var rowNbr = -1
	var tp=mElement.getAttribute("tp")
	try	{
		var elemId=mElement.id
		var pos=elemId.lastIndexOf("r")
		if (pos > 0)
		{
			rowNbr=formState.currentRow
			elemId=elemId.substr(0,pos)+"r0"
		}
		if (tp=="text")
		{
			if(typeof(TEXT_OnBlur)=="function")
			{
				var txtItem=idColl.getItemByFld(elemId)
				if( !TEXT_OnBlur(txtItem.id,rowNbr) )
					return
			}
		}
		else if (tp=="select")
		{
			if(typeof(VALUES_OnBlur)=="function")
			{
				var valItem=idColl.getItemByFld(elemId)
				if( !VALUES_OnBlur(valItem.id,rowNbr) )
					return
			}
		}
	} catch (e) { }

	var crtio_msg_portal = "";
	if(keyColl.keyBuffer && keyColl.keyBuffer.state.crtio.Request != "")
		crtio_msg_portal = keyColl.keyBuffer.state.crtio.Message;
	var crtio_msg_form = ""
	if(formState.crtio.Request != "")
		crtio_msg_form = formState.crtio.Message;

	if (!formState.tranAtEnd && !formState.agsError && crtio_msg_form == "" && crtio_msg_portal == "")
		lawForm.setMessage("")
	formState.tranAtEnd=false;

	mElement.className="textBox"
	lawformApplyDefaultValue(mElement.id)
	lawformApplyAlternateReference(mElement.id)

	if (tp!="fc" && tp!="select")
		lawformCallRules(mElement.id,rowNbr)
}

//-----------------------------------------------------------------------------
function lawformTextMouseOver(mElement)
{
	if (!formState || !formState.formReady)
		return;
	
	if (mElement.getAttribute("tooltip") && mElement.getAttribute("tooltip") != "")
		return;
		
	if (!mElement.getAttribute("size"))
		return;
		
	var size = parseInt(mElement.getAttribute("size"), 10);			
	var bEditUpper = (mElement.getAttribute("edit") && mElement.getAttribute("edit") == "upper") ? true : false;
		
	mElement.title = (mElement.value.length > size)
		? ((bEditUpper) ? mElement.value.toUpperCase() : mElement.value)
		: "";
}

//-----------------------------------------------------------------------------
function lawformCallRules(elemId, rowNbr, bForceCall, bSynch)
{
	bForceCall = (typeof(bForceCall)=="boolean" ? bForceCall : false);
	bSynch = (typeof(bSynch)=="boolean" ? bSynch : false);
		
 	// pending rules call?
	if (httpIDA && httpIDA.doneState == 0)
	{
		window.setTimeout("lawformCallRules('"+elemId+"','"+rowNbr+"',"+bForceCall+","+bSynch+")", 100);
		return;
 	}

	var mElement=document.getElementById(elemId);
	if (!mElement) return;

	rulesKeyRow=formState.currentRow
	var value= rowNbr == -1 ?
			lawForm.getElementValue(mElement.id) :
			lawForm.getElementValue(mElement.id, rowNbr) ;
	var knb=mElement.getAttribute("knb")||"";
	
	//gen table does has not implemented rule calls
	if(knb.substring(0,1)=="@")
		return;
		
	if (doDefSwitch == 1)
	{
		doDefSwitch = 0;
		return;
	}

	if( mElement.getAttribute("hasrule")=="1" && knb!=""
	&& mElement.getAttribute("startval")!=value
	|| bForceCall)
	{
		rulesFieldId = mElement.id
		rulesFieldDet = mElement.det
		try
		{
			var RulesCall = frmMakeIDAString("RL", mElement.id)
			RulesCall += "&_KNB="+knb+"&"+knb+"=" + value

			if(!bSynch)
			{
				httpIDA=new portalWnd.RequestObject(portalWnd)
				httpIDA.doneState=0;
				httpIDA.onreadystatechange=frmHandleRulesReturn
				httpIDA.open("GET",RulesCall,true);
				httpIDA.setRequestHeader("content-type","text/html")
				httpIDA.send(null);
			}
			else
			{
				var xmlDoc=portalWnd.SSORequest(RulesCall, null, null, null, false);
				if (xmlDoc.status)
				{
					portalObj.setMessage(portalObj.getPhrase("ERROR_LOAD_XML"));
					return;
				}
				frmDoNewRules(xmlDoc);
			}
		}
		catch(e) { 
			rulesFieldId = "";
			rulesFieldDet = "";
		}
	}
}

//-----------------------------------------------------------------------------
function frmHandleRulesReturn()
{
	try	{
		if (!httpIDA) return;

		if(httpIDA.readyState()==4)
		{
			if(httpIDA.status()==200)
			{
				var ssoAuthObj = new portalWnd.SSOAuthObject();	// get singleton auth object
				var newText="";
				var ssoResponse=null;
				if (httpIDA.getResponseHeader("content-type") == "text/xml")
				{
					if (httpIDA.cached_url != ssoAuthObj.configUrl 
					&& portalWnd.isTimeout(httpIDA.responseXML()))
					{
						ssoResponse=portalWnd.handleTimeout(httpIDA,"text/html","object",false);
						if (ssoResponse)
							newText = ssoResponse.responseText;
					}
					else
						newText = httpIDA.responseText();
				}
				else
				{
					// Check for login page first...
					if (httpIDA.cached_url != ssoAuthObj.configUrl 
					&& portalWnd.isLoginPage(httpIDA))
					{
						ssoResponse = portalWnd.showLoginPage(httpIDA,"text/html","object",false);
						if (ssoResponse)
							newText = ssoResponse.responseText;
					}
					else
						newText = httpIDA.responseText();
				}

				// procede with response
				httpIDA=null;
				if (newText)
				{
					var re=new RegExp(" encoding=.*\\?>","g");
					newText=newText.replace(re,"?>")
					frmDoNewRules(newText)
				}
			}
			if (httpIDA)
				httpIDA.doneState=1;
		}
	}
	catch (e) { 
		httpIDA=null;
		portalWnd.oError.displayExceptionMessage(e,LAWFORMJS,"frmHandleRulesReturn","",window)
	}
}

//-----------------------------------------------------------------------------
function frmDoNewRules(newXML)
{
	var trick;
	var idaKeys;
	var idaKey;
	var idaOccurs;
	var idaOccur;
	var formKeys;
	var formKey;
	var fld;
	var value="";
	var keynbr;

	trick=new portalWnd.DataStorage(newXML);
	if(trick.status)
	{
		rulesFieldId="";
		rulesFieldDet="";
		return;
	}
	if (trick.isErrorDoc())
	{
		rulesFieldId="";
		rulesFieldDet="";
		return;
	}

	idaKeys=trick.document.getElementsByTagName("KEYFLD");
	for(var i=0;i<idaKeys.length;i++)
	{
		idaKey=idaKeys[i];
		idaOccurs=idaKey.getElementsByTagName("OC");
		keynbr=idaKey.getAttribute("keynbr");

		if (rulesFieldId.indexOf("r")!=-1)
			formKeys=keyColl.indexByKeyDetail(keynbr, rulesFieldDet);
		else
			formKeys=keyColl.indexByKey(keynbr);

		if (idaOccurs.length == 0)
		{
			formKey=keyColl.findNearestField(rulesFieldId,rulesKeyRow,formKeys);
			value=""
			if(idaKey.hasChildNodes())
			{
				if (portalWnd.trim(idaKey.childNodes[0].nodeValue) != "")
					value=idaKey.childNodes[0].nodeValue;
			}
			if (lastControl && lastControl.id.replace(/r\d+$/,"r"+rulesKeyRow) == formKey)
			{
			    var crtVal = (lastControl.id.indexOf("r") == -1 
					? lawForm.getElementValue(lastControl.id)
					: lawForm.getElementValue(lastControl.id, rulesKeyRow));
				if (lastControl.getAttribute("startval") != crtVal)
					continue;
			}
			
			// if the formKey is subordinate tab setElement of Magic
			if (formKey.indexOf("r")!=-1 &&  rulesKeyRow != formState.currentRow)
			{
					var htmElem=lawForm.UIDocument.getElementById(formKey.replace(/r\d+/, "r0"));
					if (htmElem && htmElem.getAttribute("par") && htmElem.getAttribute("par").indexOf("TF") >= 0)
					{
							lawForm.magic.setElement(formKey,value,rulesKeyRow);
							continue;
					}
			}		
			
			lawForm.setElementValue(formKey,value);
			if (value != "" && (rulesFieldId == lastControl.id))
				lastControl.select()
		}
		else
		{
			for (var n=0;n<formKeys.length;n++)
			{
				formKey = formKeys[n];
				fld=formKey.fldNbr;
				if (lastControl && lastControl.id.replace(/r\d+$/,"r"+rulesKeyRow) == fld.replace(/r\d+$/,"r"+rulesKeyRow))
				{
				    var crtVal = (lastControl.id.indexOf("r") == -1 
						? lawForm.getElementValue(lastControl.id)
						: lawForm.getElementValue(lastControl.id, rulesKeyRow));
					if (lastControl.getAttribute("startval") != crtVal)
						continue;
				}
				
				if (fld.indexOf("r") == -1 || formKeys.length == idaOccurs.length) //PT 186400 - some occurs fields don't belong to detail lines. && JT-161281 some fields have 1:1 mapping e.g. OC within detail fields
				{
					idaOccur = idaOccurs[n];
					value = frmIsConsideredBlank(fld,idaOccur)?"":idaOccur.childNodes[0].nodeValue;
					lawForm.setElementValue(fld, value, rulesKeyRow);
				}
				else
				{
					for (var m=0;m<idaOccurs.length;m++)
					{
						idaOccur = idaOccurs[m];
						fld = fld.replace(/r\d+$/,"r"+m)
						value=frmIsConsideredBlank(fld,idaOccur)?"":idaOccur.childNodes[0].nodeValue;
						lawForm.setElementValue(fld,value,rulesKeyRow);
					}
				}
			}
		}
	}
	rulesFieldId="";
	rulesFieldDet="";
}

//-----------------------------------------------------------------------------
// returns whether a numeric field = 0 or an alpha field = ""
// based on the field's edit value
function frmIsConsideredBlank(fldName,keyFld)
{
	var formFld;
	var edVal;
	var value;
	var bIsBlank=false;

	formFld=document.getElementById(fldName);
	if(formFld)
		edVal=formFld.getAttribute("edit");
	else 
	{
		formFld = lawForm.IEXML.selectSingleNode("//fld[@nbr='"+fldName.replace(/r\d+/,"r0")+"']")
		if(formFld)edVal=formFld.getAttribute("ed")
	}
	if(!edVal)edVal="string"////Outputs dont have edit value, consider that as string

	if(keyFld.hasChildNodes()==false)
		return true;
	else
		value=keyFld.childNodes[0].nodeValue;

	// alpha check
	if(!edVal && value=="")
		bIsBlank=true;
	else
	{
		switch(edVal)
		{
		// numeric check
		case "numeric":
		case "signed":
		case "date":
		case "time":
			if(parseFloat(value)==0)
				bIsBlank=true;
			break;
		// alpha check
		case "upper":
		case "right":
		case "string":
			if(value=="")
				bIsBlank=true;
			break;
		}
	}
	return bIsBlank
}

//-----------------------------------------------------------------------------
function lawformFillLineDefaults(mElement)
{//this is called on the onchange event for a lfc field
	try{

	var par = mElement.parentNode;

	if(par && par.getAttribute("rowIndex"))
		lawformFillDefaults(par.getAttribute("rowIndex"))

	return true;
	
	}catch(e){
		portalWnd.oError.displayExceptionMessage(e,LAWFORMJS,"lawformFillLineDefaults","",window);
		return false;
	}	
}
//-----------------------------------------------------------------------------
function lawformFillDefaults(row)
{
	try{

	var bLineOnly = (typeof(row) != "undefined" ? true : false);

	if(bLineOnly)
	{
		var lfcFld = (bLineOnly && strRowFCFldNbr != "" ? strRowFCFldNbr.replace(/r\d+/, "r" + row) : null);
		var lfcValue = (lfcFld ? portalWnd.trim(lawForm.getElementValue(lfcFld)) : "");	
	
		if(lfcValue == "")	return false;
		var loop = defColl.defFlds.length;
		
		for(var i=0; i < loop; i++)
		{
			var oDefItem = defColl.defFlds[i];
			
			if(!oDefItem.det) continue;
			if(formState.currentDetailArea != oDefItem.det) continue;			
			
			var fldNbr = oDefItem.fld.replace(/r\d+/, "r" + row);
			lawformApplyDefaultValue(fldNbr);
		}
		
		return true;	
	}
	else
	{
		var loop = defColl.defFlds.length;
		
		for(var i=0; i < loop; i++)
		{
			var oDefItem = defColl.defFlds[i];
			var fldNbr = oDefItem.fld;

			if(oDefItem.det != null) continue;
	
			lawformApplyDefaultValue(fldNbr);
		}
	
		//try to fill in line defaults 
		var dtlArea = document.getElementById(formState.currentDetailArea);
		if(!dtlArea) return true;
	
		var rows = parseInt(dtlArea.getAttribute("rows"),10);
		
		for(var j=0; j < rows; j++)
			lawformFillDefaults(j);
	
		return true;	
	}

	}catch(e){
		portalWnd.oError.displayExceptionMessage(e,LAWFORMJS,"lawformFillDefaults","",window);
		return false;
	}
}
//-----------------------------------------------------------------------------
function lawformButtonFocus(btn)
{
	if (typeof(btn) == "undefined")
		return;
	try	{
		if (lawForm.fldHelp)
			portalWnd.frmShowFieldHelp(window, btn.id);
		lastControl=btn;
		btn.className = (btn.className.substr(0,9) == "flowChart"
			 ? "flowChartButtonFocus" : "buttonOver" );

		var elemId=btn.id
		var rowNbr = -1;
		var pos=elemId.lastIndexOf("r")
		if (pos > 0)
		{
			portalWnd.frmSetActiveRow(window, btn)
			rowNbr=formState.currentRow
			elemId=elemId.substr(0,pos)+"r0"
		}
		if(typeof(BUTTON_OnFocus)=="function")
		{
			var btnItem=idColl.getItemByFld(elemId);
			BUTTON_OnFocus(btnItem.id,rowNbr);
		}
	} catch (e) { }
}
//-----------------------------------------------------------------------------
function lawformButtonBlur(btn)
{
	btn.className = (btn.className.substr(0,9) == "flowChart"
		? "flowChartButton" : "");
}
//-----------------------------------------------------------------------------
function lawformButtonMouseOut(btn)
{
	if (btn.className == "flowChartButtonHighlight")
		btn.className = "flowChartButton";
}
//-----------------------------------------------------------------------------
function lawformButtonMouseOver(btn)
{
	if (btn.className == "flowChartButton")
		btn.className = "flowChartButtonHighlight"
}
//-----------------------------------------------------------------------------
function lawformButtonUpdate(btn)
{
	if (btn.getAttribute("hide") && btn.getAttribute("hide") == "1")
		return

	// set button to invisible if there is no button text
	var parDiv=btn.parentNode;
	if (!parDiv) return;

	if (btn.innerHTML == "")
	{
		parDiv.style.visibility="hidden";
		return;
	}

	// apply batch button security
	if (lawForm && lawForm.isBatchForm)
	{
		// if open as 'parameters update', don't enable batch buttons
		var nm=btn.getAttribute("nm");
		var bIsBatchBtn = portalWnd.cmnArrayContains(batchBtnNames,nm);
		if (strHKValue && strHKValue.substr(0,9)=="_JOBPARAM" && bIsBatchBtn)
			return;

		var batchIndex = portalWnd.cmnArrayIndex(batchBtnNames,nm);
		if (bIsBatchBtn && batchIndex > 1)
		{
			if (configObj.getRoleOptionValue(batchRoleNames[batchIndex],"0") != "1")
				return;
		}
	}

	parDiv.style.visibility="visible";
	// set button title (if none)
	if (!btn.getAttribute("title"))
		btn.setAttribute("title",btn.innerHTML);
}
//-----------------------------------------------------------------------------
function lawformOnPush(evt, btn, TKN)
{
	// form disabled?
	if (!formState.formReady) return

    evt = portalWnd.getEventObject(evt)
    if (!evt) return;
	var evtElem=portalWnd.getEventElement(evt);
	if (typeof(evtElem.id) == "undefined")
		evtElem=btn;

	//sync up the data (magic) and the screen.
	lawForm.magic.getUIData();
	
	// set active row?
	var currentRow=0
	var iPos=evtElem.id.indexOf("r")
	if (iPos != -1)
	{
		var detail=evtElem.getAttribute("det")
		var parent=evtElem.getAttribute("par")
		// Push button on a subordinate tab?
		if (detail && parent && parent.indexOf("TF")!=-1)
			currentRow=formState.currentRow
		else
			currentRow=parseInt(evtElem.id.substr(iPos+1))
	}
	if (formState.currentRow!=currentRow)
		portalWnd.frmSetActiveRow(window, evtElem)

	formState.setValue("currentField", evtElem.id)
	if(evtElem.id.indexOf("r") > 0)
	{
		formState.setValue("currentRow", currentRow)
		formState.setValue("currentDetailArea", evtElem.getAttribute("det"))
		lawForm.magic.getTabData(formState.currentDetailArea, formState.currentRow)
	}

	// is there custom script for button clicks?
	if(typeof(BUTTON_OnClick)=="function")
	{
		try	{
			var rowNbr = -1
			var btnId=btn.id
			var pos=btnId.lastIndexOf("r")
			if (pos > 0)
			{
				rowNbr=formState.currentRow
				btnId=btnId.substr(0,pos)+"r0"
			}
			var btnItem=idColl.getItemByFld(btnId)
			if( !BUTTON_OnClick(btnItem.id,rowNbr) ) return;
		} catch (e) { }
	}
	
	// setup formState object
	var bReplaceWindow=false
	formState.setValue("doPush", true)
	formState.setValue("pushFromRow", false)
	evtElem.setAttribute("hkey", lawForm.magic.buildHK(false))	

	if(evtElem.id.indexOf("r") > 0)
	{
		formState.setValue("pushFromRow", true)
		var visited = evtElem.getAttribute("visited")
		evtElem.setAttribute("visited", (visited ? visited += currentRow + "~" : "~" + currentRow + "~"))
	}
	else
		evtElem.setAttribute("visited", "1")	

	// URL is specified?
	if(TKN.indexOf("http://")==0 || TKN.indexOf("https://")==0)
	{
		window.open(TKN)
		return
	}
	if(TKN.indexOf("URL=")==0)
	{
		window.open(TKN.substr(4))
		return
	}
	// javascript function?
	if(TKN.indexOf("function=")==0)
	{
		formState.setValue("doPush", false);
		eval(TKN.substr(9));
		return;
	}
	// arg is a function code?
	if (TKN.indexOf("FC=")==0)
	{
		formState.setValue("pushFromRow", false);
		lawformDoFunction(portalWnd.trim(TKN.substr(3)))
		return
	}

	var re = new RegExp(/=CM|=UR/g);
	var attachKey=re.exec(TKN)
	if (attachKey != null)
	{
		formState.setValue("doPush", false);
		formState.setValue("pushFromRow", false);
		// arg specifies an attachment
		var AttachFldNbr=evtElem.id
		var AttachTkn=TKN.substring(0,attachKey.index)
		portalWnd.frmDoAttachments(window, AttachTkn, AttachFldNbr)
		return
	}

	// if arg specifies a form transfer
	if(TKN.indexOf("Tran=")==0)
	{
		TKN=TKN.substr(5);
		bReplaceWindow=true
	}
	// if arg specifies a normal push
	if(TKN.indexOf("open=")==0)
		TKN=TKN.substr(5);
	// if current form is a flowchart then execute form tranfser
	if(strTKN.match(portalWnd.flowRE))
		bReplaceWindow=true

	// kluge to try and catch internal transfers
	// (the notknxfer comes before magic consumes the formstate...
	// so it must check doPush before doTransfer)
	formState.setValue("doTransfer", true)

	if (bReplaceWindow)
	{
		formState.setValue("doPush", false)
		formState.setValue("pushFromRow", false)
		lawformDoTransfer(TKN)
	}
	else
	{
		var source=portalWnd.frmBuildXpressCall(TKN,strPDL,"modal",null,null,null,null,strHost)
		lawformPushWindow(source);
	}
}

//-----------------------------------------------------------------------------
function lawformShowMagic()
{
	if (strHost.toLowerCase()=="page") return;
	lawformPushWindow(portalObj.formsDir+"/about.htm")
	portalObj.setTitle(strTitle + " - " + lawForm.getPhrase("LBL_ABOUT"))
}

//-----------------------------------------------------------------------------
function lawformPopWindow()
{
	if (parent.formState)
	{
		// pushed form which returned an error won't have formState object
		if (formState && formState.crtio && formState.crtio.DspXlt!="")
			parent.strDefaultFC=formState.crtio.DspXlt
			
		// pushed form is unloading
		parent.bPushedForm=false;
		parent.formState.setValue("doDefine",false)
		parent.formState.setValue("doPush",false)
		parent.formState.setValue("doTransfer",false)
		parent.formState.setValue("skipInitialTxn",false)
		parent.formState.setValue("selectDetailRow",false)
		
		if (parent==self) return;

		// pushed form which returned an error won't have this function
		if (typeof(xslClearFramework) == "function")
			xslClearFramework(true);

		var obj=parent.document.getElementById("utilDiv");
		if (obj) obj.style.display="none";

		// pushed form which returned an error won't have portalObj
		var path=(portalObj ? portalObj.path : parent.portalObj.path);
		obj=parent.document.getElementById("utilFrame");
		if (obj) obj.src=path+"/blank.htm";

		obj=parent.document.getElementById("utilContainer");
		if (obj) obj.style.display="none";

		parent.formState.setValue("formReady",true)
		parent.lawformOnResize();
	}
}

//-----------------------------------------------------------------------------
function lawformPushWindow(source)
{
	if (typeof(parent.lawformMaximizeUtilityWindow)=="function")
		parent.lawformMaximizeUtilityWindow()

	// build global buffer for pushed window (if it's another form)
	if ( source.toLowerCase().indexOf("xpress") != -1
	|| source.toLowerCase().indexOf("host") != -1 )
 			keyColl.buildKeyBuffer()
 			
	bPushedForm=true;

	xslClearFramework(true);
	formState.setValue("formReady",false)

	if (oHelp && oHelp.isVisible)
		oHelp.hide()
	if (oWizard && oWizard.isVisible)
		oWizard.hide()

	var obj=document.getElementById("utilDiv")
	obj.style.display="block";

	obj=document.getElementById("utilContainer")
	obj.style.display="block";
	obj.style.visibility="visible"

	obj=document.getElementById("utilFrame")
	obj.src=source

	lawformMaximizeUtilityWindow()
}

//-----------------------------------------------------------------------------
// user clicked on list driven button (or from formOnLoad)
function lawformShowList(bInit)
{
	if (typeof(bInit) != "boolean")
		bInit=false

	// clear (or load) all the data from required fields collection
	for (var i = 0; i < listColl.reqFlds.length; i++)
	{
		if (bInit)
			listColl.reqFlds[i].data=lawForm.getElementValue(listColl.reqFlds[i].fld)
		else
			listColl.reqFlds[i].data=""
	}

	portalWnd.frmDoList(window)
}

//-----------------------------------------------------------------------------
// user clicked on a datadirectory entry
function lawformDataDrill(keynbr, fld)
{
	if (!lawForm.useLists) return;

	// clear all the data from current fld to end of collection
	var bFound=false
	for (var i = 0; i < listColl.reqFlds.length; i++)
	{
		if (bFound || listColl.reqFlds[i].fld==fld)
		{
			bFound=true
			listColl.reqFlds[i].data=""
		}
	}
	portalWnd.frmDoList(window)
}


//-----------------------------------------------------------------------------
// callback function for list driven field selected/updated
function lawformListUpdated(fld,value)
{
	var reqItem=listColl.getItem(fld)
	reqItem.data=value
	lawForm.setElementValue(fld,value)
}

//-----------------------------------------------------------------------------
// callback function for list driven
function lawformListDone(req)
{
	// put the leftbar and toolbar back
	xslInitFramework();

	// anything returned?
	if (!req)
	{
		lawForm.positionInFirstField()
		return;
	}

	// request to go to define token
	if (typeof(req) == "string")
	{
		var fld=""
		for (var i = 0; i < listColl.reqFlds.length; i++)
		{
			if (req==listColl.reqFlds[i].deftkn)
			{
				fld=listColl.reqFlds[i].fld
				break;
			}
		}
		if (fld!="")
			portalWnd.frmDoDefine(window, req, fld)
		return;
	}

	if (formState.currentRow == "")
		formState.setValue("currentRow", 0)

	for (var i = 0; i < req.reqFlds.length; i++)
	{
		var reqItem=req.reqFlds[i];
		var id=reqItem.fld
		var value=reqItem.data
		var keyflds=reqItem.keyflds
		reqItem=listColl.getItem(id)
		reqItem.data=value
		lawForm.setElementValue(id,value)

		if (keyflds)
		{
			var keyVals = keyflds.getElementsByTagName("KEYFLD")
			for (var j=0; j < keyVals.length; j++)
			{
				var formKeys=keyColl.indexByKey(keyVals[j].getAttribute("keynbr"));
				if(formKeys)
				{
					var formKey=keyColl.findNearestField(id,formState.currentRow,formKeys);
					if (keyVals[j].hasChildNodes())
					{
						value=keyVals[j].childNodes[0].nodeValue
					}

					else
						value="";
				lawForm.setElementValue(formKey,value);
				}
			}
		}

		var elem=document.getElementById(reqItem.fld)
		if (!elem) continue
		lawformCallRules(elem.id, formState.currentRow, true, true)
	}
	lawformDoFunction("I");
}

//-----------------------------------------------------------------------------
// callback function for drill select
function lawformDrillSel(keysNode, bRestored)
{
	bRestored = (typeof(bRestored)!="boolean") ? false : bRestored;
	if (!bRestored)
	{
		// put the leftbar and toolbar back
		if (portalWnd.oUserProfile.isOpenWindow("select"))
			formState.setValue("formReady",true)
		else
			xslInitFramework();

		lastControl.focus();
		lawformTextFocus(lastControl);
	}

	// anything returned?
	if (!keysNode) return;

	var fld = lastControl.id
	var keyNode

	if (formState.currentRow == "")
		formState.setValue("currentRow", 0)

	// is there custom script for the return from a drill select? -- allows for customization 
	// of the keys buffer (selection may be canceled by returning null, if implemented the
	// default behavior should be to return the keys buffer passed in as parm 2)
	if (typeof(TEXT_OnAfterDrillSelect) == "function")
	{
		try	{
            var txtItem = idColl.getItemByFld(fld.replace(/r\d+/, "r0"))
			var retNode = TEXT_OnAfterDrillSelect(txtItem.id, keysNode, formState.currentRow);
            if (!retNode) return;
            keysNode = retNode;
		} catch (e) { }
	}

	var keyVals = keysNode.getElementsByTagName("KEYFLD")
	for (var i=0; i < keyVals.length; i++)
	{
		var formKeys=keyColl.indexByKey(keyVals[i].getAttribute("keynbr"));
		if (formKeys)
		{
			var formKey=keyColl.findNearestField(fld,formState.currentRow,formKeys);
			var value = (keyVals[i].hasChildNodes()
				? keyVals[i].childNodes[0].nodeValue
				: "");
				
			if (!value)
				value = keyVals[i].childNodes[0].text;
	
			var mElement = document.getElementById(formKey);
			var ed = (!mElement ? "" : mElement.getAttribute("edit"));
			value = (ed=="numeric" || ed=="signed" ? this.portalWnd.strTrim(value): value);
			lawForm.setElementValue(formKey,value);
		}
	}

	if (lastControl.edit && lastControl.edit!="upper")
		portalWnd.edPerformEdits(lastControl)
	lawformCallRules(lastControl.id,formState.currentRow,true)

	if (formState.autoComplete && formState.autoCompleteFC!="")
	{
		formState.autoComplete=false
		lawformDoFunction(formState.autoCompleteFC)
		formState.autoCompleteFC=""
	}
}

//-----------------------------------------------------------------------------
// callback function for attachments
function lawformAttachDone()
{
	if (portalWnd.oUserProfile.isOpenWindow("attachment"))
		formState.setValue("formReady",true)
	else
		xslInitFramework();

	try {
		lastControl.focus()
		if (lastControl.nodeName.toLowerCase()=="button")
			lawformButtonFocus(lastControl)
		else if (lastControl.getAttribute("type").toLowerCase()!="button")
			lawformTextFocus(lastControl)
	} catch (e) { }
}

//-----------------------------------------------------------------------------
// callback function for drill explorer
function lawformExplorerDone()
{
	if (portalWnd.oUserProfile.isOpenWindow("explorer"))
		formState.setValue("formReady",true)
	else
		xslInitFramework();

	try {
		lastControl.focus()
		if (lastControl.nodeName.toLowerCase()=="button")
			lawformButtonFocus(lastControl)
		else if (lastControl.getAttribute("type").toLowerCase()!="button")
			lawformTextFocus(lastControl)
	} catch (e) { }
}

//-----------------------------------------------------------------------------
// generic callback function to restore framework
function lawformRestoreCallback()
{
	xslInitFramework();
	try {
		lastControl.focus()
		if (lastControl.nodeName.toLowerCase()=="button")
			lawformButtonFocus(lastControl)
		else if (lastControl.getAttribute("type").toLowerCase()!="button")
			lawformTextFocus(lastControl)
	} catch (e) { }
}

//-----------------------------------------------------------------------------
// callback function for dropdown select
function lawformDropSel(value)
{
	var mElement=lastControl
	if (value!=null)
	{
		var row=window.formState.currentRow
		var rowposition = mElement.id.indexOf("r")
		var values=value.split("|")

		if (rowposition > 0)
		{
			lawForm.setElementValue(mElement.id,values[0],row)
			lawForm.magic.setElement(mElement.id,values[1],row)
		}
		else
		{
			lawForm.setElementValue(mElement.id,values[0])
			lawForm.magic.setElement(mElement.id,values[1])
		}
	}
	mElement.focus()
	mElement.select()
	lawformApplyXLTValue(mElement.id)
}
//-----------------------------------------------------------------------------
// callback function for context menu
function lawformContextSel(value)
{
	var mElement=lastControl
	mElement.focus()
	mElement.select()
	if (!value) return

	var values=value.split("|")
	switch (values[0])
	{
	case "attach":
		portalWnd.frmDoAttachments(window, values[1], mElement.id)
		break;
	case "define":
		portalWnd.frmDoDefine(window, values[1], mElement.id)
		break;
	case "drill":
		portalWnd.frmDoDrill(window, values[1], mElement.id)
		break;
	case "open":
		formState.setValue("skipInitialTxn", true);
		lawformDoTransfer(values[1])
		break;
	case "select":
		portalWnd.frmDoSelect(window, values[1], mElement.id)
		break;
	}
}

//-----------------------------------------------------------------------------
// callback function for calendar select
function lawformCalendarSel2(date)
{
	var mElement=lastControl;
	if (date)
	{
		var sz=mElement.getAttribute("size")
		var strDate=portalWnd.edSetUserDateFormat(date,sz)
		lawForm.setElementValue(mElement.id,strDate)
	}
	mElement.focus()
	mElement.select()
}

//---------------------------------------------------------------------------------------
// related actions for batch tokens
function lawformBatchAction(TKN)
{
	var jobName=lawForm.getElementValue(strJobNameFld);
	var usrName=lawForm.getElementValue(strUsrNameFld);
	var tkn=TKN.split("=");

	switch (tkn[1])
	{
		case " JD ":		// jobdef
			portalWnd.switchContents(portalWnd.getGoJobDefURL(jobName) + "&" + usrName);
			break;
		case " JL ":		// job list
			portalWnd.switchContents(portalWnd.getGoJobListURL(usrName,jobName,portalWnd.jobUtilPageIndex));
			break;
	}
}
//---------------------------------------------------------------------------------------
// apply default value to a single field
function lawformApplyDefaultValue(fldNbr)
{
	var defFldKey = fldNbr.replace(/r\d+/, "r0");
	var oDefItem = defColl.getItem(defFldKey);

	if(!oDefItem)
		return "";
		
	//if isxlt default apply xlt value not the default value 
	if(oDefItem.isxlt)
	{
		var xltFldNbr = oDefItem.defval;

		//if default is in a subordinate tab do not add the current row because
		//html elelments for subordinate detail fields will have an identity of _fxxr0
		
		//xpress issue with default returned as 0000 for a numeric (oe10)
		//shouldnt that be a value of blank for the portal and if the default value is nothing,
		//then is it really a default.
		if(oDefItem.par.indexOf("DT") == 0)
			xltFldNbr = xltFldNbr.replace(/r\d+/, "r" + formState.currentRow);

		lawformApplyXLTValue(xltFldNbr);
		return true
	}
			
	//apply default if field is empty
	var mElement = document.getElementById(fldNbr);
	var curFormVal = portalWnd.trim(lawForm.getElementValue(fldNbr, null, true));
	var curMagicVal = portalWnd.trim(lawForm.magic.getElement(fldNbr));

	if(curFormVal && curFormVal != "")
	{
		lawForm.setElementValue(fldNbr, curFormVal);
		return false;
	}
	
	if(!mElement && curMagicVal && curMagicVal != "")
		return false;

	//get default value
	var defaultValue = lawformGetDefaultValue(fldNbr, oDefItem);
	
	if(!defaultValue)
		return false;

	// apply default if line fc has a value
	if(fldNbr.indexOf("r") != -1 && strRowFCFldNbr)
	{
		var row = fldNbr.substring(fldNbr.indexOf("r") + 1);
		var lfcValue = lawForm.getElementValue(strRowFCFldNbr, row);

		if(!portalWnd.trim(lfcValue)) return false;
	}

	lawForm.setElementValue(fldNbr, defaultValue);
		
	return true;
}
//---------------------------------------------------------------------------------------
function lawformGetDefaultValue(fldNbr, oDefItem)
{
	var defFldNbr = fldNbr.replace(/r\d+/, "r0");
	oDefItem = (oDefItem ? oDefItem : defColl.getItem(defFldNbr));
	
	//does field have a default value
	if(!oDefItem)
		return "";

	var defaultValue = lawformConvertDefaultValue(oDefItem);	

	var mElement = (!mElement ? document.getElementById(fldNbr) : mElement);
	var size = (mElement ? mElement.getAttribute("size") : "");

	//current time		
	if(defaultValue == "@CT" || defaultValue == "CCT")
		return portalWnd.edGetCurrentTime(size);
	//current date
	if(defaultValue == "@TD" || defaultValue == "CTD")
		return portalWnd.edFormatDate("t",size);
	//user environment variable	
	if(defaultValue.indexOf("LAW_WEB_USR.") == 0)
		return portalWnd.oUserProfile.getAttribute(defaultValue.substring(12));
	//another field
	if(defaultValue.indexOf("_f") == 0)
	{
		var mDefElement = document.getElementById(defaultValue);
	
		if(mDefElement && formState.currentRow < 1)
			return lawForm.getElementValue(defaultValue);
		else if (mDefElement && formState.currentRow > 0)
		{
			var currentRow = parseInt(formState.currentRow)-1;
			return tranMagic.getFieldValue(defaultValue.replace(/r\d+/, "r" + currentRow)); //use field value like in LID, LSF-409
		}
		else
			return tranMagic.getElement(defaultValue.replace(/r\d+/, "r" + formState.currentRow));
	}
	return defaultValue;

}
//---------------------------------------------------------------------------------------
function lawformConvertDefaultValue(oDefItem)
{
	
	var defaultValue = (oDefItem ? oDefItem.defval : "");	
		
	//standard batch default have no value (lawsonusername, name, and productline)
	if(lawForm.isBatchForm)
	{
		if(oDefItem.fld == "_f9")
			return "LAW_WEB_USR.lawsonusername";
		
		if(oDefItem.fld == "_f10")
			return "LAW_WEB_USR.name";
		
		if(oDefItem.fld == "_f11")
			return (strPDL ? strPDL : "LAW_WEB_USR.productline");
	}
 	 	
	if(defaultValue.indexOf("_f") == 0)
		return defaultValue;
	
	if(defaultValue.indexOf("fld_") == 0)
	{
		var oNamItem = namColl.getNameItem(defaultValue.substring(4));
		return (!oNamItem ? defaultValue : oNamItem.fld);
	}
	
	if(defaultValue.indexOf("knb_") == 0)
	{
		var keyItemsAry = keyColl.indexByKey(defaultValue.substring(4));		
		return (keyItemsAry.length == 0 ? defaultValue : keyItemsAry[0].fldNbr);
	}
	
	return defaultValue;
}
//---------------------------------------------------------------------------------------
// apply translation value for a single field
function lawformApplyXLTValue(fldNbr)
{
	var htmElem = document.getElementById(fldNbr);
	if (!htmElem) return;

	var xlt=htmElem.getAttribute("xltis")
	if (!xlt || xlt == "") return;
	
	var tp = (!htmElem.getAttribute("tp") ? "" : htmElem.getAttribute("tp").toLowerCase());
	if (!tp || tp == "") return;
	if(tp != "select" && tp != "hidden") return;

	var strHtmId = htmElem.id;

	var fieldValAry = portalWnd.frmGetFieldValueList(window, strHtmId);
	if (!fieldValAry || !fieldValAry.length) return;

	var blnFound = false;
	var lengthFieldValAry = fieldValAry.length;
	var strVal = lawForm.getElementValue(strHtmId);
	var strDisp = "";

	for (var i = 0; i < lengthFieldValAry; i++)	
	{
		if(strVal == fieldValAry[i].getAttribute("tran"))
		{
			strDisp = fieldValAry[i].getAttribute("text");
			blnFound = true;
			break;
		}		
	}	

	if(!blnFound)
	{ 
		for (var i = 0; i < lengthFieldValAry; i++)	
		{
			if(strVal == fieldValAry[i].getAttribute("disp"))
			{
				strDisp = fieldValAry[i].getAttribute("text");
				blnFound = true;
				break;
			}		
		}	
	}

	if(!blnFound)
	{
		var strPadVal = strVal;
		var sz = htmElem.getAttribute("size");
		var loop = (typeof(sz) != "number" ? 0 : parseInt(sz,10));
	 
		for (var i = 0; i < loop; i++)	
		{
			strPadVal = "0" + strPadVal;

			for (var j = 0; j < lengthFieldValAry;  j++)
			{				
		
				if(strPadVal == fieldValAry[j].getAttribute("disp"))
				{
					strDisp = fieldValAry[j].getAttribute("text");
					blnFound = true;
					break;
				}
			}
			if(blnFound) break;
		}	
	}

	var htmXLT = document.getElementById(xlt);
	if (!htmXLT) return;
	
	var id = htmXLT.id;
	
	if(id.indexOf("r") != -1)
	{
		var rowVal = fldNbr.substring(fldNbr.indexOf("r"));
		id = id.substring(0, id.indexOf("r")) + rowVal;
	}

	lawForm.setElementValue(id,strDisp)
}

//---------------------------------------------------------------------------------------
// apply alternate reference
function lawformApplyAlternateReference(fldNbr)
{
	var htmElem = document.getElementById(fldNbr)
	if (!htmElem) return;

	var keynbr = htmElem.getAttribute("knb");
	if (!keynbr) return;

	var altref = htmElem.getAttribute("altref")
	if (!altref || altref == "") return;

	if (htmElem.id.indexOf("r") != -1 && formState.currentDetailArea.length > 0)
		var formKeys = keyColl.indexByKeyDetail(keynbr, formState.currentDetailArea);
	if (!formKeys || formKeys.length == 0)
		var formKeys = keyColl.indexByKey(keynbr);

	var currValue = lawForm.getElementValue(htmElem.id)
	for(var i=0; i<formKeys.length; i++)
	{
		var key = formKeys[i];
		if (!key.altref) continue;
		if(htmElem.id.indexOf("r") != -1 && key.detail != "")
		{
			if(key.detail == formState.currentDetailArea)
			{
				tranMagic.setElement(key.fldNbr, currValue, formState.currentRow);
				lawForm.setElementValue(key.fldNbr, currValue, formState.currentRow);
			}
		}
		else
		{
			tranMagic.setElement(key.fldNbr, currValue);
			lawForm.setElementValue(key.fldNbr, currValue);
		}
	}
}

//---------------------------------------------------------------------------------------
function lawformAutoSelect(fld)
{
	var msg=lawForm.getMessage()
	portalWnd.frmDoSelect(window,null,fld)
	lawForm.setMessage(msg)
}

//-----------------------------------------------------------------------------
function frmMakeIDAString(type,fld,knb)
{
	if (!type || !fld)
		return ("");

	var IDAString = strIDAPath + "?_OUT=XML&keyUsage=PARAM&_TYP=" + type + "&_PDL=" + strPDL.toUpperCase() +
		"&_SYS=" + strSYS + "&_TKN=" + strTKN;
		
	if (typeof(knb) != "undefined")
	{
		var _KNB = ((knb.indexOf(" ") == 2) ? knb.substr(0,2) : knb); 
		IDAString+="&_KNB=" + _KNB;
	}

	IDAString += keyColl.buildIdaString(fld);
	return IDAString;
}

//-----------------------------------------------------------------------------
function lawformPageUpdate(pStorage, bRefresh)
{
	if(strHost.toLowerCase() == "page")
		return (tranMagic.portalPageRefresh(pStorage, bRefresh))
}

//-----------------------------------------------------------------------------
function lawformDoTransfer(token)
{
	if(typeof(FORM_OnBeforeTransfer)=="function")
	{
		try	{
			if (!FORM_OnBeforeTransfer(token))
				return;
		} catch (e) { }
	}
	if (typeof(token) == "string")
	{
		if (token.substr(0,4).toLowerCase() == "http")
		{
			portalWnd.switchContents(token)
			return;
		}
		else if (lawForm.isBatchForm && token.indexOf("FC=")==0 && portalWnd.isJobFC(token.substr(3)) )
		{
			lawformBatchAction(token);
			return;
		}
		else if (token.indexOf("::") != -1)
		{
			var parms=token.split("::")
			var tkn=parms[0]
			var custId=parms[1]
			var xpressCall=portalWnd.frmBuildXpressCall(tkn,
					portalWnd.oUserProfile.getAttribute("productline"), "notmodal", "", custId)
			portalWnd.switchContents(xpressCall)
			return;
		}
	}

	// kluge to try and catch internal transfers
    var bIsFlowChart = strTKN.match(portalWnd.flowRE) ? true : false;
   	formState.setValue("doTransfer", true);
   	//This flags magic.initialize not to do a initialTransaction
   	if(bIsFlowChart)
    	formState.setValue("skipInitialTxn", bIsFlowChart);
	portalWnd.formTransfer(token,strPDL,null,"","",strHost)
}

//---------------------------------------------------------------------------------------
// related links for batch tokens
function lawformJobLink(TKN)
{
	portalWnd.switchContents(portalWnd.getJobURL(TKN,false));
}

//-----------------------------------------------------------------------------
// NOTE: attach/detach not supported in Netscape

function lawformOnClickDetach()
{
// called from a pushed window only!

	// change button text and call detach/maximize on parent
	var tb = (formletToolbar ? formletToolbar : portalObj.toolbar);
	if(parent.utilWindowState.currentState!="MAXIMIZED")
	{
		tb.changeButtonText("btnDetach",portalObj.getPhrase("LBL_DETACH"));
		parent.lawformMaximizeUtilityWindow();
	}
	else
	{
		tb.changeButtonText("btnDetach",portalObj.getPhrase("LBL_MAXIMIZE"));
		parent.lawformDetachUtilityWindow();
		lastControl.focus();
	}
}

function lawformDetachUtilityWindow()
{
	if (utilWindowState.currentState!="MAXIMIZED")
	{
		lawformMaximizeUtilityWindow()
		return
	}
	utilWindowState.currentState="DETACHED"
	var fFrame=document.getElementById("mainDiv")
	var container=document.getElementById("utilContainer")

	with (container.style)
	{
		overflow="hidden";
		top="50px";
		left="50px";
		width=fFrame.offsetWidth-100
		height=fFrame.offsetHeight-100
		padding="1px"
		paddingTop="5px"
		paddingBottom="5px"
	}

	var obj=document.getElementById("utilFrame")
	obj.style.width=container.offsetWidth-10;
	obj.style.height=container.offsetHeight-10;
}

//-----------------------------------------------------------------------------
function lawformMaximizeUtilityWindow()
{
	utilWindowState.currentState="MAXIMIZED"
	var fFrame=document.getElementById("mainDiv")
	var container=document.getElementById("utilContainer")
	var formToolbar=document.getElementById("formtoolbar")

	var scrWidth=(portalWnd.oBrowser.isIE 
		? document.body.offsetWidth : window.innerWidth);
	var scrHeight=(portalWnd.oBrowser.isIE 
		? document.body.offsetHeight : window.innerHeight);

	with (container.style)
	{
		top="0px";
		left="0px";
		width=scrWidth;
		height=scrHeight;
		padding="0px"
	}
	var obj=document.getElementById("utilFrame")
	obj.style.width=scrWidth;
	obj.style.height=scrHeight;
}

//-----------------------------------------------------------------------------
function mdragStart(event, id)
{
	var el;
	var x, y;

	dragObj.elNode = (portalWnd.oBrowser.isIE
		? window.event.srcElement
		: event.target);
	if (dragObj.elNode.nodeType == 3)
		dragObj.elNode = dragObj.elNode.parentNode;

	if (portalWnd.oBrowser.isIE)
	{
		x = window.event.clientX + document.documentElement.scrollLeft + document.body.scrollLeft;
		y = window.event.clientY + document.documentElement.scrollTop + document.body.scrollTop;
	}
	else
	{
		x = event.clientX + window.scrollX;
		y = event.clientY + window.scrollY;
	}

	if(event.clientY-parseInt(dragObj.elNode.style.top, 10) >parseInt(dragObj.elNode.style.height, 10)-5)
		dragObj.type="resize"
	else
		dragObj.type="move"

	dragObj.cursorStartX = x;
	dragObj.cursorStartY = y;
	dragObj.elStartLeft  = parseInt(dragObj.elNode.style.left, 10);
	dragObj.elStartTop   = parseInt(dragObj.elNode.style.top,  10);
	dragObj.elStartWidth  = parseInt(dragObj.elNode.style.width, 10);
	dragObj.elStartHeight   = parseInt(dragObj.elNode.style.height,  10);

  	if (isNaN(dragObj.elStartLeft)) dragObj.elStartLeft = 0;
  	if (isNaN(dragObj.elStartTop))  dragObj.elStartTop  = 0;

  	if (portalWnd.oBrowser.isIE)
  	{
    	dragObj.elNode.setCapture()
    	document.attachEvent("onmousemove", mdragGo);
    	document.attachEvent("onmouseup",   mdragStop);
    	window.event.cancelBubble = true;
    	window.event.returnValue = false;
  	}
  	else
  	{
    	document.addEventListener("mousemove", mdragGo,   true);
    	document.addEventListener("mouseup",   mdragStop, true);
    	event.preventDefault();
  	}
}

//-----------------------------------------------------------------------------
function mdragGo(event)
{
	var x, y;

	// get cursor position with respect to the page.
	if (portalWnd.oBrowser.isIE)
	{
		x = window.event.clientX + document.documentElement.scrollLeft + document.body.scrollLeft;
		y = window.event.clientY + document.documentElement.scrollTop + document.body.scrollTop;
	}
	else
	{
		x = event.clientX + window.scrollX;
		y = event.clientY + window.scrollY;
	}

	// move drag element by the same amount the cursor has moved.
	if(dragObj.type=="resize")
	{
		try{
			dragObj.elNode.style.width = (dragObj.elStartWidth + x - dragObj.cursorStartX) + "px";
			dragObj.elNode.style.height = (dragObj.elStartHeight + y - dragObj.cursorStartY) + "px";

			if(parseInt(dragObj.elNode.style.height,10)>1 && parseInt(dragObj.elNode.style.width,10)>1)
			{
				frm=dragObj.elNode.getElementsByTagName("IFRAME")
				frm=frm[0]
				portalWnd.status=dragObj.elNode.style.width
				frm.style.width=(parseInt(dragObj.elNode.style.width,10)-10)+"px"
				hgt=parseInt(dragObj.elNode.style.height,10) - frm.offsetTop-5
				if(hgt>1)
					frm.style.height=hgt+ "px"
			}
		} 
		catch(e) { // size error
		}
	}
	else
	{
		dragObj.elNode.style.left = (dragObj.elStartLeft + x - dragObj.cursorStartX) + "px";
		dragObj.elNode.style.top = (dragObj.elStartTop + y - dragObj.cursorStartY) + "px";
	}

	if (portalWnd.oBrowser.isIE)
	{
		window.event.cancelBubble = true;
		window.event.returnValue = false;
	}
	else
		event.preventDefault();
}

//-----------------------------------------------------------------------------
function mdragStop(event)
{
	// stop capturing mousemove and mouseup events.

	if(parseInt(dragObj.elNode.style.top,10)<0)
		dragObj.elNode.style.top="0px"
	if(parseInt(dragObj.elNode.style.left,10)<0)
		dragObj.elNode.style.left="0px"
	if (portalWnd.oBrowser.isIE)
	{
		document.detachEvent("onmousemove", mdragGo);
		document.detachEvent("onmouseup", mdragStop);
		document.releaseCapture()
	}
	else
	{
		document.removeEventListener("mousemove", mdragGo,   true);
		document.removeEventListener("mouseup", mdragStop, true);
	}
}

//-----------------------------------------------------------------------------
function lawformCopyDetailField(mElement,inv)
{
	var fldNbr=mElement.id;
	var iPos=fldNbr.indexOf("r");
 	if (iPos==-1) return;

	// field in a subordinate tab?
	var parent=mElement.getAttribute("par");
	var bfldSubTab=(parent && parent.indexOf("TF")!=-1);
	var rowNbr=bfldSubTab 
		? formState.currentRow 
		: parseInt(fldNbr.substr(iPos+1));
	if (rowNbr==0) return;

	var value=(bfldSubTab
		? lawForm.magic.getElement(fldNbr,rowNbr-1)
		: lawForm.getElementValue(fldNbr.replace(/r\d+$/,"r"+(rowNbr-1))));

	if (mElement.getAttribute("edit") == "signed" 
	&& typeof(inv) != "undefined")
	{
        value = (value.indexOf("-") != -1) 
            ? value.replace(/-/, "")
            : value + "-"; 
		lawForm.setElementValue(fldNbr, value);
	}
	else
		lawForm.setElementValue(fldNbr, value);

	// advance to next field?
	if (lawForm.fldAdvance)
	{
		try {
			fldNbr = lawformGetNextFieldNbr(fldNbr);
			if (!fldNbr) return;
			var nextElem = window.document.getElementById(fldNbr);
			if (nextElem)
				window.setTimeout("lawformMoveToNextField('"+nextElem.id+"')",5);
		} catch (e) { }
	}
}

//-----------------------------------------------------------------------------
function lawformImageOnClick(mElement)
{
	if (!formState.formReady) return;

	if(typeof(IMAGE_OnClick)=="function")
	{
		try {
			var imgItem = idColl.getItemByFld(mElement.id);
			var rowNbr = -1;
			var imgId = mElement.id;
			var pos = imgId.lastIndexOf("r");
			if (pos > 0)
			{
				rowNbr = formState.currentRow;
				imgId = imgId.substr(0,pos) + "r0";
			}
			IMAGE_OnClick(imgItem.id,rowNbr);
		} catch (e) { }
	}
}

//-----------------------------------------------------------------------------
function lawformCheckboxOnClick(mElement)
{
	try	{
		if (!formState.formReady) return;

		var vals=portalWnd.frmGetFieldValueList(window, mElement.id)
		var bCurVal = (mElement.checked) ? "1" : "0";
		var sTran=""
		if (vals)
		{
			if (vals[0].getAttribute("checked")==bCurVal)
				sTran=vals[0].getAttribute("tran")
			if (vals[1].getAttribute("checked")==bCurVal)
				sTran=vals[1].getAttribute("tran")
		}
		lawForm.magic.setElement(mElement.id,sTran)
		lawformApplyXLTValue(mElement.id);

		if(typeof(CHECK_OnClick)=="function")
		{
			var rowNbr = -1
			var cbxId=mElement.id
			var pos=cbxId.lastIndexOf("r")
			if (pos > 0)
			{
				rowNbr=formState.currentRow
				cbxId=cbxId.substr(0,pos)+"r0"
			}
			var cbxItem=idColl.getItemByFld(cbxId)
			CHECK_OnClick(cbxItem.id,rowNbr)
		}
	} catch (e) { }
}

//-----------------------------------------------------------------------------
function lawformRadioBtnOnClick(mElement)
{
	if (!formState.formReady) return;

	lawForm.magic.setElement(mElement.id,mElement.value)

	if (typeof(RADIO_OnClick)=="function")
	{
		try	{
			var rowNbr = -1
			var radioId=mElement.id
			var pos=radioId.lastIndexOf("r")
			if (pos > 0)
			{
				rowNbr=formState.currentRow
				radioId=radioId.substr(0,pos)+"r0"
			}
			var radioItem=idColl.getItemByFld(radioId)
			RADIO_OnClick(radioItem.id,rowNbr)
		} catch (e) { }
	}
}

//-----------------------------------------------------------------------------
function lawformShowLinks()
{
	var actionBtn=portalWnd.document.getElementById("LAWTBBUTTONlinks")
	actionBtn.className="";
	var dropBtn=portalWnd.document.getElementById("LAWDROPBUTTONlinks")
	dropBtn.className="";
	portalWnd.iWindow.dropObj.clearItems()

	var len=aFormLink.length;
	var initSelect="";
	for (var i = 0; i < len; i++)
	{
		var menuText = aFormLinkText[i];
		var menuAction = aFormLink[i];
		var menuClick=portalWnd.iWindow.dropObj.trackMenuClick
		var menuHref="LINKCHANGE";
		portalWnd.iWindow.dropObj.addItem(menuText,null,menuAction,menuClick,menuHref);
	}
	portalWnd.iWindow.dropObj.showIframe(initSelect,actionBtn,
				"dropObj.portalWnd.frames[0].transferSelect");
}
//-----------------------------------------------------------------------------
function transferSelect(tkn)
{
	// have to re-route if pushed form active
	if (window.frames.length > 0
	&& typeof(window.frames[0].transferSelect)=="function")
	{
		window.frames[0].transferSelect(tkn);
		return;
	}

	if (typeof(tkn) != "undefined")
		lawformDoTransfer(tkn);
	else
	{
		try {
			lastControl.focus();
			lastControl.select();
		} catch (e) { }
	}
}

//-----------------------------------------------------------------------------
function setDefaultFC()
{
	// reset default during framework init:
	// if a CRTIO fc is specified use it,
	// else if a form default is specified use it,
	// else if an inquire fc is specified use it, 
	// else if only 1 valid fc use it,
	// else use first fc from XSL generated array.

	if (parent.formState && parent.formState.crtio.DspXlt!="")
		strDefaultFC=parent.formState.crtio.DspXlt
	else if (strDefaultFC=="" && strInquireFC!="")
		strDefaultFC=strInquireFC
	else if (strDefaultFC=="" && strValidFCs.length==1)
		strDefaultFC=strValidFCs
	else if (strDefaultFC=="" && aFormFC.length > 0)
		strDefaultFC=aFormFC[0];

	var actionBtn=portalWnd.document.getElementById("LAWTBBUTTONactions")
	if (!actionBtn) return;
	actionBtn.style.marginLeft="0";
	var text=portalWnd.erpPhrases.getPhrase("lblInitiateFormAction");

	if (strDefaultFC!="")
	{
		var len = aFormFC.length;
		for (var i=0; i < len; i++)
		{
			if (aFormFC[i]==strDefaultFC)
			{
				actionBtn.innerHTML=aFormFCText[i];
				actionBtn.setAttribute("title",text+" "+aFormFCText[i]);
				return;
			}
		}
	}

	// we're here because no default was set: use first in the list
	if (aFormFC.length > 0)
	{
		strDefaultFC = aFormFC[0];
		actionBtn.innerHTML=aFormFCText[0];
		actionBtn.setAttribute("title",text+" "+aFormFCText[0]);
	}

}
//-----------------------------------------------------------------------------
function lawformShowActions()
{
	var actionBtn=portalWnd.document.getElementById("LAWTBBUTTONactions")
	portalWnd.iWindow.dropObj.clearItems()
	var len=aFormFC.length;
	var initSelect="";
	for (var i = 0; i < len; i++)
	{
		if (strDefaultFC == aFormFC[i])
			initSelect=aFormFCText[i];
		var menuText = aFormFCText[i];
		var menuAction = aFormFC[i];
		var menuClick=portalWnd.iWindow.dropObj.trackMenuClick
		var menuHref="FORMFCCHANGE";
		portalWnd.iWindow.dropObj.addItem(menuText,null,menuAction,menuClick,menuHref);
	}
	portalWnd.iWindow.dropObj.showIframe(initSelect,actionBtn,
				"dropObj.portalWnd.frames[0].lawformDefaultFCChange");
}
//-----------------------------------------------------------------------------
function lawformDefaultFCChange(fc)
{
	// have to re-route if pushed form active
	if (window.frames.length > 0
	&& typeof(window.frames[0].lawformDefaultFCChange)=="function")
	{
		window.frames[0].lawformDefaultFCChange(fc);
		return;
	}

	// menu cancelled?
	var actionBtn=portalWnd.document.getElementById("LAWTBBUTTONactions")
	if (typeof(fc) != "undefined")
	{
		// drop down changed default fc
		var fcText=lawformGetFCText(fc);
		if (fcText)
		{
				var text=portalWnd.erpPhrases.getPhrase("lblInitiateFormAction");
			actionBtn.innerHTML=fcText;
			actionBtn.setAttribute("title",text+" "+fcText);
				strDefaultFC=fc
			}
		}
	if (actionBtn) actionBtn.focus();
}
//-----------------------------------------------------------------------------
function lawformDoDefaultFC(evt,mElement)
{
	// execute default fc
	if (strDefaultFC=="") return;
	if (typeof(mElement)!="undefined")
		lawformDoFunctionFromHotkey(strDefaultFC,mElement);
	else
		lawformDoFunction(strDefaultFC);
}
//-----------------------------------------------------------------------------
function lawformGetFCText(fc)
{
	if (typeof(fc) == "undefined" || fc == "" || !fc)
		return "";

	// drop down changed default fc
	var len = aFormFC.length;
	var strText="";
	for (var i=0; i < len; i++)
	{
		if (aFormFC[i]==fc)
		{
			strText=aFormFCText[i];
			break;
		}
	}
	return strText;
}
//-----------------------------------------------------------------------------
function lawformShowSpecialActions()
{
	var actionBtn=portalWnd.document.getElementById("LAWTBBUTTONSpActions")
	portalWnd.iWindow.dropObj.clearItems()
	var len=aActionsFC.length;
	var initSelect="";
	for (var i = 0; i < len; i++)
	{
		var menuText = aActionsText[i];
		var menuAction = aActionsFC[i];
		var menuClick=portalWnd.iWindow.dropObj.trackMenuClick
		var menuHref="SPECIALACTION";
		portalWnd.iWindow.dropObj.addItem(menuText,null,menuAction,menuClick,menuHref);
	}
	portalWnd.iWindow.dropObj.showIframe(initSelect,actionBtn,
				"dropObj.portalWnd.frames[0].lawformInitiateSpecialAction");
}
//-----------------------------------------------------------------------------
function lawformInitiateSpecialAction(fc)
{
	// have to re-route if pushed form active
	if (window.frames.length > 0
	&& typeof(window.frames[0].lawformDefaultFCChange)=="function")
	{
		window.frames[0].lawformInitiateSpecialAction(fc);
		return;
	}

	// menu cancelled?
	var actionBtn=portalWnd.document.getElementById("LAWTBBUTTONSpActions")
	if (actionBtn) actionBtn.focus();
	if (typeof(fc) != "undefined")
		window.setTimeout("lawformDoFunction('"+fc+"')",20);
}

//-----------------------------------------------------------------------------
function lawformSetStartVal(mElement)
{
	if (!mElement) return;

    if (mElement.getAttribute("hasrule") == "1" && mElement.getAttribute("startval"))
    {
        var rowNbr = (mElement.id.lastIndexOf("r") > 0)
            ? formState.currentRow
            : -1;
    	mElement.setAttribute("startval", rowNbr == -1 
    	    ? lawForm.getElementValue(mElement.id) 
    	    : lawForm.getElementValue(mElement.id, rowNbr) );
	}
}

//-----------------------------------------------------------------------------
function lawformTextAreaFocus(mElement)
{
	try	{
		if(typeof(TEXTAREA_OnFocus)=="function")
		{
			var txtItem=idColl.getItemByFld(mElement.id);
			TEXTAREA_OnFocus(txtItem.id);
		}
	} catch (e) { }
}

//-----------------------------------------------------------------------------
function lawformTextAreaBlur(mElement)
{
	try	{
		if(typeof(TEXTAREA_OnBlur)=="function")
		{
			var txtItem=idColl.getItemByFld(mElement.id);
			TEXTAREA_OnBlur(txtItem.id);
		}
	} catch (e) { }
}

//-----------------------------------------------------------------------------
// form value list validation
function lawformCheckValueAgainstList(mElement)
{
	if (!mElement) return true;

	var tp = (mElement.getAttribute("tp") ? mElement.getAttribute("tp").toLowerCase() : null);	
	if (tp != "fc" && tp != "select")
		return true;
	
	var itemValue = lawForm.getElementValue(mElement.id);
	var decSep = portalWnd.oUserProfile.getAttribute("decimalseparator");
	var regex = new RegExp(decSep, "g");
	itemValue = (decSep != "." ? itemValue.replace(regex ,".") : itemValue);
	if (portalWnd.trim(itemValue) == "")
	{
		try {
			lawformApplyXLTValue(mElement.id);
		} catch(e){}
		return true;
	}

	var editType =	mElement.getAttribute("edit")
	var bNumber = ((editType == "numeric" ||  editType == "signed") ? true : false);
	itemValue = (bNumber ? parseFloat(itemValue, 10) : itemValue);
	var bFound = false;

	// get valid values, if none found return true
	var vals = portalWnd.frmGetFieldValueList(window, mElement.id);
	if (!vals) return true;

	// build msg while checking if value is valid
	var msgAry = new Array();
	var loop = vals.length;
	
	for (var i=0; i < loop; i++)
	{
		var validValue = vals[i].getAttribute("disp");
		msgAry.push(validValue);

		// check if a range of valid numeric values exist
		if(portalWnd.cmnIsValueInString(":", validValue))
		{
			var rangeAry = validValue.split(":");
			rangeAry[0] = (decSep != "." ? rangeAry[0].replace(regex ,".") : rangeAry[0]);
			rangeAry[1] = (decSep != "." ? rangeAry[1].replace(regex ,".") : rangeAry[1]);
			var lowerLimit = parseFloat(rangeAry[0], 10)
			var upperLimit = parseFloat(rangeAry[1], 10)

			if(portalWnd.cmnIsNumberBetween(lowerLimit, upperLimit, itemValue))
 			{
	 			lawformApplyXLTValue(mElement.id);
	 			return true;
			}
		}

	   if(bNumber)
			{
				if (parseFloat(validValue, 10))
					validValue = parseFloat(validValue, 10)
				else if (parseInt(validValue, 10))
					validValue = parseInt(validValue, 10)
			}

		if ((validValue == itemValue) || (!bNumber && validValue == itemValue.toUpperCase()))
		{
			lawformApplyXLTValue(mElement.id);
			return true;
		}
	}

	// failed validation, try to direct user back to input field
	// if we can not set focus (element not dislayed or rendered) then return true
	// this allows the user to click on buttons and tabs
	try {
		mElement.focus();
		mElement.className="textBoxHighLight";
		var msg = portalWnd.lawsonPortal.getPhrase("VALUE_NOT_LIST");
		msg = msg + msgAry.join(";");
		portalObj.setMessage(msg);
		return false;	

	} catch(e) {}
	return true;			
}

//-----------------------------------------------------------------------------
function lawformMoveToNextField(nextId)
{
	// advance to next field?
	try {
		mElement = window.document.getElementById(nextId);
		if (!mElement) return;

		// check for tabregion
		if (mElement.className != "tabArea")
			mElement.focus();
		else
		{
			var paneId = mElement.getAttribute("curtab")+"PANE";
			portalWnd.frmPositionInFirstTabField(window,document.getElementById(paneId))
		}
		
	} catch (e) { }
}

//-----------------------------------------------------------------------------
function lawformGetNextElement(evt)
{
	// function to determine whether to advance to
	// next screen input element following a keydown
	// returns null or the next input element if current
	// element data entry is 'complete'

	// this feature supported for IE only!
	//if (!portalWnd.oBrowser.isIE) return null;

	// must have an event object
	if (!evt || typeof(evt) == "undefined") return null;

	// get reference to current element
	var evtElem = portalWnd.getEventElement(evt);

	// ignore any keystrokes if current element is button
	if (evtElem.nodeName.toLowerCase()!="input")
		return null;
	if (evtElem.getAttribute("type")=="button")
		return null;

	// ignore certain keystrokes (like tab and others)
	if (evt.keyCode < 32) return null;
	if (!evt.shiftKey && evt.keyCode < 45 && evt.keyCode != 32)
		return null;

	var nextElem = null;
	var fldNbr = null;
	var sz = evtElem.getAttribute("maxlength");
	var ed = evtElem.getAttribute("edit");

	// Note: we must test (input length - 1) against maxsize because 
	// key stroke not yet accepted into value buffer

	if (!ed || ed == "upper" || (ed == "numeric" && !evtElem.getAttribute("decsz")))
	{
		// be sure we have a digit keyCode for numerics
		if (ed == "numeric" && !portalWnd.isDigit(evt.keyCode))
			return null;
		if (evtElem.value.length == parseInt(sz,10)-1)
		{
			try {
				// if the text is selected and the user enters a keystroke,
				// the existing text will be overwritten, so don't advance
				if (evtElem.isTextEdit)
				{
					var rng = evtElem.createTextRange();
					if (!rng || (evtElem.document 
								&& evtElem.document.selection 
								&& evtElem.document.selection.type == "Text"))
						return null;
				}
				
			} catch (e) { }
			fldNbr = lawformGetNextFieldNbr(evtElem.getAttribute("id"));
		}
		if (!fldNbr) return null;
		nextElem = window.document.getElementById(fldNbr);
	}
	else if (ed == "date")
	{
		// for dates we will advance on a single 'T' (today),
		// on 8 digits or on max size
		var doneLen = lawForm.useShortDate ? 5 : 7;
		var re = lawForm.useShortDate ? /\d{5}/ : /\d{7}/;
		if ((evtElem.value.length == 0 && evt.keyCode == 84)		// T
		|| (evtElem.value.length == doneLen 
				&& portalWnd.isDigit(evt.keyCode) 
				&& re.test(evtElem.value))
		|| (evtElem.value.length == parseInt(sz,10)-1))
		{
			fldNbr = lawformGetNextFieldNbr(evtElem.getAttribute("id"));
			if (!fldNbr) return null;
			nextElem = window.document.getElementById(fldNbr);
		}
	}
	else if (ed == "signed" || (ed == "numeric" && evtElem.getAttribute("decsz")))
	{
		var prefix = portalWnd.oUserProfile.getAttribute("prefixsign");
		var decsep = portalWnd.oUserProfile.getAttribute("decimalseparator");
		var decsz = parseInt(evtElem.getAttribute("decsz"),10);
		var idx = evtElem.value.indexOf(decsep);

		// for signed fields, if user attribute says sign is a 
		// suffix, advance only on entry of a +/-
		if (ed == "signed" && prefix == "0")
		{
			if (portalWnd.isSign(evt.keyCode,evt.shiftKey))
			{
				fldNbr = lawformGetNextFieldNbr(evtElem.getAttribute("id"));
				if (!fldNbr) return null;
				return (window.document.getElementById(fldNbr));
			}
			return null;
		}

		// having excluded the sign preference, now we advance
		// only when max decimals is reached		
		if (!isTextSelected(evtElem) 
			&& (getCaretPosition(evtElem) == evtElem.value.length)
			&& evtElem.value.length >= decsz 
			&& idx != -1 
			&& ((evtElem.value.length - idx) == decsz))
		{
			// here we will never advance decimal or sign (+/-) entry so only digits are valid
			if (!portalWnd.isDigit(evt.keyCode)) return null;

			fldNbr = lawformGetNextFieldNbr(evtElem.getAttribute("id"));
			if (!fldNbr) return null;
			nextElem = window.document.getElementById(fldNbr);
		}
	}

	return nextElem;
}
//-----------------------------------------------------------------------------
function lawformGetNextFieldNbr(fldNbr)
{
	// this function supported for IE only!
	//if (!portalWnd.oBrowser.isIE) return null;

	var fldNode = lawForm.IEXML.selectSingleNode("//fld[@nbr='"+fldNbr.replace(/r\d+/,"r0")+"']");
	if (!fldNode) return null;
	var sibNode = fldNode.nextSibling;
	var retFldNbr = "";

	// if it's a detail element, get it's parent (detail node)
	var dtlFldRE=/r\d+$/i;
	if (fldNbr.match(dtlFldRE))
	{
		var dtlNode = fldNode.parentNode;
		retFldNbr = lawformGetNextDtlFieldNbr(fldNode);
		if (retFldNbr) return retFldNbr;
		// no next detail field, so see if detail has sibling
		sibNode = dtlNode.nextSibling;
	}

	var retValue = lawformGetNextFieldSibling(sibNode);
	if (retValue) return retValue;

	// not found: go to tabregion next sibling?
	sibNode = null;
	if (fldNode.parentNode.nodeName == "tab")
		sibNode = fldNode.parentNode.parentNode.nextSibling;
	else if (fldNode.parentNode.nodeName == "scroll")
		sibNode = fldNode.parentNode.nextSibling;

	if (!sibNode) return null;

	retValue = lawformGetNextFieldSibling(sibNode);
	if (retValue) return retValue;

	return null;
}

//-----------------------------------------------------------------------------
function lawformGetNextFieldSibling(sibNode)
{
	var retNode = sibNode;
	var bDone=false;
	while (retNode != null && !bDone)
	{
		if (retNode.nodeName == "scroll")
		{
			retNode = firstChildElement(retNode);
			continue;
		}
		if (retNode.nodeName == "detail")
		{
			retFldNbr = lawformGetNextDtlFieldNbr(firstChildElement(retNode));
			if (retFldNbr) return retFldNbr;
		}
		if (retNode.nodeName == "push")
			return retNode.getAttribute("nbr");
		if (retNode.nodeName == "tabregion")
			return retNode.getAttribute("nbr");		// special case to catch on exit!

		while (retNode && retNode.nodeName != "fld")
			retNode = retNode.nextSibling;
		var tp = (retNode ? retNode.getAttribute("tp").toLowerCase() : "");
		if (retNode && (tp != "text" && tp != "fc" && tp != "select"))
		{
			retNode = retNode.nextSibling;
			continue;
		}
		bDone=true;
	}
	if (retNode)
		return retNode.getAttribute("nbr");
	return null;
}

//-----------------------------------------------------------------------------
function lawformGetNextDtlFieldNbr(fldNode)
{
	var dtlNode = fldNode.parentNode;
	var maxRows = parseInt(dtlNode.getAttribute("height"),10);
	var curRow = parseInt(formState.currentRow,10);

	var retNode = fldNode.nextSibling;
	var bDone=false;
	while (retNode != null && !bDone)
	{
		if (retNode.nodeName == "push" && retNode.getAttribute("btnnm")) 	//also check if btn is existing.
		{
			if (retNode.getAttribute("par").indexOf("TF") < 0)
				return retNode.getAttribute("nbr").replace("r0","r"+curRow);
			else
				return retNode.getAttribute("nbr")
		}
		while (retNode && retNode.nodeName != "fld")
			retNode = retNode.nextSibling;
		var tp;
		if (retNode.nodeName != "push")
		{
			tp = (retNode ? retNode.getAttribute("tp").toLowerCase() : "");
			if (retNode && (tp != "text" && tp != "fc" && tp != "select"))
			{
				retNode = retNode.nextSibling;
				continue;
			}
		}
		bDone=true;
	}

	// did we find an input field in same row? also check if current field is in a subtab of a detail line. return row 0 if it is in subtab.
	
	if (retNode && fldNode.getAttribute("par").indexOf("TF") < 0)
		return retNode.getAttribute("nbr").replace("r0","r"+curRow);
	else if (retNode)
		return retNode.getAttribute("nbr")

	// didn't find input field in same row, go to first field of next row
	retNode = dtlNode.selectSingleNode("./fld[@tp='Fc' or @tp='Text' or @tp='Select']");
	var nextRow = curRow+1;
	return (nextRow < maxRows
		? retNode.getAttribute("nbr").replace("r0","r"+nextRow)
		: null);
}
function getCaretPosition(field) {
   var caretPos = -1;
   if (document.selection && document.selection.createRange) {
     var range = document.selection.createRange().duplicate();
     if (range.parentElement() == field) {
       range.moveStart('textedit', -1);
       caretPos = range.text.length;
     }
   } else if (field.selectionEnd) {
     caretPos = field.selectionEnd;
   }
   return caretPos;
} 
function isTextSelected(evtElem)
{
	// if the text is selected and the user enters a keystroke,
	// the existing text will be overwritten, so don't advance
	if (evtElem.isTextEdit)
	{
		var rng = evtElem.createTextRange();
		if (!rng || (evtElem.document 
			&& evtElem.document.selection 
			&& evtElem.document.selection.type == "Text"))
			return true;
	}
	return false;
}
