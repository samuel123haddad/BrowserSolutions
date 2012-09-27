/*
 * PortalAdapter.java
 */
package com.itk.browsersolution.adapters.firefox.js;

import com.itk.browsersolution.adapters.interfaces.IJavaScriptAdapter;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.FileUtils;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.TextCursor;
import com.itk.browsersolution.vo.ParameterQuestionHolder;
import java.io.File;

/**
 * Class PortalAdapter
 * Refactored
 * 
 * @author Samuel Haddad - shaddad@itktechnologies.com
 * @since 26/09/12
 * @version 2.3
 */
public class PortalAdapter implements IJavaScriptAdapter{

    @Override
    public boolean changeContent(File file, ParameterQuestionHolder parameterQuestionHolder) {
        StringBuffer bf = FileUtils.loadText(file);
        boolean modified = false;
        TextCursor cursor = new TextCursor(bf);
        if (cursor.find("if (bDomain)")) {
            cursor.goStartLine();
            if (! cursor.isText("//")) {
                cursor.insert("//");
                cursor.goNextLine();
                if (! cursor.isText("//") && cursor.getLine().trim().startsWith("alert")) {
                    cursor.insert("//");
                }
            }
        }
        if (cursor.find("if (navigator.appName.indexOf(\"Microsoft\") >= 0)")) {
            modified = true;
            cursor.goStartLine();
            if (! cursor.isText("//")) {
                cursor.insert("//");
                cursor.goNextLine();
                if (cursor.getLine().trim().equals("{")) {
                    cursor.insert("//");
                }
                if (cursor.findNext("else")) {
                    boolean first = true;
                    cursor.goPreviousLine();
                    do {
                        if (! cursor.isText("//")) {
                            cursor.insert("//");
                        }
                        if (cursor.getLine().indexOf("}") != -1) {
                            if (! first)
                            {
                                break;
                            }
                                
                            first = false;
                        }
                        if (! cursor.goNextLine()) {
                            break;
                        }
                    } while (! cursor.isEndOfText());
                }
            }
        }
        if (cursor.find(".childNodes.length)")) {
            cursor.findNext(")");
            cursor.insert(" && menus[i].childNodes[0].nodeType != 3");
            modified = true;
        }
        if (bf.indexOf("SER#009") < 0) {
            if (!cursor.find("replaceStr")) {
                modified = true;
                cursor.find("function processMessageString(str)");
                cursor.goPreviousLine();
                cursor.insert(
                        "//-----------------------------------------------------------------------------\n"
                        + "// SER#009:1.0:Compatibility with firefox\n"
                        + "function replaceStr(text, rege, func) {\n"
                        + "\tvar re = oBrowser.isIE ? new RegExp(rege, \"\") : new RegExp(rege,\"g\");\n"
                        + "\tvar fc = func;\n"
                        + "\tif (! oBrowser.isIE) {\n"
                        + "\t\treturn text.replace(re, function(m, k) { return fc(k); });\n"
                        + "\t}\n"
                        + "\twhile (text.match(re)) {\n"
                        + "\t\ttext = text.replace(re, fc(RegExp.$1));\n"
                        + "\t}\n"
                        + "\treturn text;\n"
                        + "}\n");
                cursor.goNextLine();
                cursor.goNextLine();
                cursor.goNextLine();
                cursor.goNextLine();
                cursor.insert(
                        "\tstr = replaceStr(str, \"\\&\\&(.*)\\&\\&\", function(key) {\n"
                        + "\t\treturn lawsonPortal.getPhrase(key);\n"
                        + "\t});\n"
                        + "\tstr = replaceStr(str, \"<<([^>]*)>>\", function(key){\n"
                        + "\t\tvar attName=key.toLowerCase(); // attribute name are LC\n"
                        + "\t\tvar attValue=(attName == \"productline\"\n"
                        + "\t\t\t? oUserProfile.getAttribute(attName,true,\"persistUserPDL\")\n"
                        + "\t\t\t: oUserProfile.getAttribute(attName));\n"
                        + "\t\treturn attValue;\n"
                        + "\t});\n");
                while (!cursor.isEndOfText() && !cursor.isText("}")) {
                    cursor.insert("//");
                    cursor.goNextLine();
                }
                cursor.goPreviousLine();
                if (cursor.isText("//")) {
                    cursor.delete(2);
                }
            }
            if (cursor.find("GuideMeCache.prototype.createItems=function()")) {
                if (cursor.nextIndexOf("var fNodes") > 0) {
                    modified = true;
                    cursor.goStartLine();
                    cursor.insert("	if (this.portalWnd.oBrowser.isIE) { // SER#009:1.0: Modified to support Firefox\n\t");
                    do {
                        if (!cursor.goNextLine()) {
                            break;
                        }
                        cursor.insert("\t");
                    } while (!cursor.ignoreSpace().isText("}") && !cursor.isEndOfText());
                    if (cursor.goNextLine()) {
                        cursor.insert(
                                "\t} else {\n"
                                + "\t\tvar nodeSnapshot = oFileList.evaluate(\"//FILE\", oFileList, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);\n"
                                + "\t\tfor (var i = 0; i < nodeSnapshot.snapshotLength; i++) {\n"
                                + "\t\t\tvar strName = nodeSnapshot.snapshotItem(i).textContent;\n"
                                + "\t\t\tstrName = strName.replace(/\\.htm$/i, \"\");\n"
                                + "\t\t\tthis.addItem(strName);\n"
                                + "\t\t}\n"
                                + "\t}\n");
                    } else {
                        System.err.println("Erro ao encontrar fim de arquivo do portal.js no momento de alterar o createItems");
                        modified = false;
                    }
                }
            }
        }
        if (modified) {
            FileUtils.saveText(file, bf);
        }
        
        
        return modified;
    }
    
}
