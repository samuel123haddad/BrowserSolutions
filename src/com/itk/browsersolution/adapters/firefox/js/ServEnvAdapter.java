/*
 * ServEnvAdapter.java
 */
package com.itk.browsersolution.adapters.firefox.js;

import com.itk.browsersolution.adapters.interfaces.IJavaScriptAdapter;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.FileUtils;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.TextCursor;
import com.itk.browsersolution.vo.ParameterQuestionHolder;
import java.io.File;

/**
 * Class ServEnvAdapter
 * Refactored
 * 
 * @author Samuel Haddad - shaddad@itktechnologies.com
 * @since 26/09/12
 * @version 2.3
 */
public class ServEnvAdapter implements IJavaScriptAdapter{

    @Override
    public boolean changeContent(File file, ParameterQuestionHolder parameterQuestionHolder) {
        StringBuffer bf = FileUtils.loadText(file);
        boolean modified = false;
        TextCursor cursor = new TextCursor(bf);
        if (!cursor.find("SER#004:1.0")) {
            cursor.setPos(0);
            if (cursor.nextIndexOf("var len=oWnd.document.scripts.length;") > 0) {
                cursor.nextIndexOf("=");
                cursor.goNextColumn();
                cursor.insert("(oWnd.document.scripts?");
                cursor.nextIndexOf(";");
                cursor.insert(":0)");
                cursor.goEndLine();
                cursor.insert("// SER#004:1.0: Browser Solution");
                modified = true;
            }else
            {
                modified = false;
            }
        }
        if (modified && !cursor.find("SER#004:2.0")) {
            cursor.setPos(0);
            if (cursor.nextIndexOf("var fullpath=(name.substr(0,1) == \"/\" ?") > 0) {
                cursor.setPos(cursor.getPos() + 14);
                cursor.replace(23, "/^[/]|^http(?:s)?:/.test(name)");
                cursor.goEndLine();
                cursor.insert("// SER#004:2.0: Browser Solution");
                modified = true;
            }else
            {
                modified = false;
            }

        }
        if (modified && !cursor.find("SER#004:3.0")) {
            cursor.goEndText();
            cursor.insert(
                  "\n//SER#004:3.0: Browser Solution\n"
                + "if ((document.body != null)&&('textContent' in document.body)&&(typeof window.__defineSetter__ == 'function')) {\n"
                + "	window.__defineSetter__('status', function(val) { \n"
                + "		var self = this;\n"
                + "		if (! self._statusbar) {\n"
                + "			self._statusbar = self.document.createElement(\"div\");\n"
                + "			self._statusbar.style.position = \"fixed\";\n"
                + "			self._statusbar.style.left = self._statusbar.style.bottom = 0;\n"
                + "			self._statusbar.style.display = \"inline-block\";\n"
                + "			self._statusbar.style.color=\"black\";\n"
                + "			self._statusbar.style.backgroundColor=\"white\";\n"
                + "			self._statusbar.style.fontSize=\"12pt\";\n"
                + "			self._statusbar.zIndex=\"10000\";\n"
                + "			self.document.body.appendChild(self._statusbar);\n"
                + "		}\n"
                + "		self._statusbar.textContent = val;\n"
                + "	});\n"
                + "	window.__defineGetter__('status', function() { \n"
                + "		return this._statusbar.textContent;\n"
                + "	});\n"
                + "}"
            );
            modified = true;
        }else
        {
            modified = false;
        }

        if (modified) {
            FileUtils.saveText(file, bf);
        }
        
        
        return modified;
    }
    
}
