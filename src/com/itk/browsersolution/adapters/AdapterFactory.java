/*
 * AdapterFactory.java
 */
package com.itk.browsersolution.adapters;

import com.itk.browsersolution.adapters.firefox.css.PortalCSSAdapter;
import com.itk.browsersolution.adapters.firefox.js.CommonAdapter;
import com.itk.browsersolution.adapters.firefox.js.FormUtilAdapter;
import com.itk.browsersolution.adapters.firefox.js.HomeAdapter;
import com.itk.browsersolution.adapters.firefox.js.InBasketAdapter;
import com.itk.browsersolution.adapters.firefox.js.MagicAdapter;
import com.itk.browsersolution.adapters.firefox.js.PagesAdapter;
import com.itk.browsersolution.adapters.firefox.js.PortalAdapter;
import com.itk.browsersolution.adapters.firefox.js.PortalConfigAdapter;
import com.itk.browsersolution.adapters.firefox.js.SSOAdapter;
import com.itk.browsersolution.adapters.firefox.js.ServEnvAdapter;
import com.itk.browsersolution.adapters.interfaces.IFileAdapter;
import com.itk.browsersolution.adapters.opera.js.BrowserCheckAdapter;
import com.itk.browsersolution.adapters.v90110.all.html.IndexAdapter;
import com.itk.browsersolution.adapters.v90110.all.js.EditsAdapter;
import com.itk.browsersolution.adapters.v90110.all.js.GlobalsAdapter;
import java.util.HashMap;
import java.util.Map;

/**
 * Class AdapterFactory Creates a factory to adapters according with file type.
 *
 * @author Samuel Haddad - shaddad@itktechnologies.com
 * @since 26/09/2012
 * @version 1.2
 */
public class AdapterFactory {

    private Map adapters = new HashMap();

    public IFileAdapter getInstance(String targetVersion, String baseFile) {

        if (targetVersion == null || targetVersion.trim().length() == 0) {
            return null;
        } else if (targetVersion.trim().equals("9.0.1.7")) {
            return getInstanceVersion9017(baseFile);
        } else if (targetVersion.trim().equals("9.0.1.10")) {
            return getInstanceVersion90110(baseFile);
        } else {
            return getInstanceVersion9017(baseFile);
        }
    }

    private IFileAdapter getInstanceVersion9017(String baseFile) {
        IFileAdapter adapter = (IFileAdapter) adapters.get(baseFile);

        if (baseFile == null || adapter != null) {
            return adapter;
        }

        if (baseFile.equals("browserCheck.js")) {
            adapter = new BrowserCheckAdapter();
        } else if (baseFile.equals("common.js")) {
            adapter = new CommonAdapter();
        } else if (baseFile.equals("servenv.js")) {
            adapter = new ServEnvAdapter();
        } else if (baseFile.equals("home.js")) {
            adapter = new HomeAdapter();
        } else if (baseFile.equals("inbasket.js")) {
            adapter = new InBasketAdapter();
        } else if (baseFile.equals("pages.js")) {
            adapter = new PagesAdapter();
        } else if (baseFile.equals("portal.js")) {
            adapter = new PortalAdapter();
        } else if (baseFile.equals("portal.css")) {
            adapter = new PortalCSSAdapter();
        } else if (baseFile.equals("formutil.js")) {
            adapter = new FormUtilAdapter();
        } else if (baseFile.equals("magic.js")) {
            adapter = new MagicAdapter();
        } else if (baseFile.equals("PortalConfig.js")) {
            adapter = new PortalConfigAdapter();
        } else if (baseFile.equals("sso.js")) {
            adapter = new SSOAdapter();
        }

        if (adapter != null) {
            adapters.put(baseFile, adapter);
        }

        return adapter;
    }

    private IFileAdapter getInstanceVersion90110(String baseFile) {
        IFileAdapter adapter = (IFileAdapter) adapters.get(baseFile);

        if (baseFile == null || adapter != null) {
            return adapter;
        }

        if (baseFile.equals("edits.js")) {
            adapter = new EditsAdapter();
        } else if (baseFile.equals("globals.js")) {
            adapter = new GlobalsAdapter();
        } else if (baseFile.equals("portal.js")) {
            CompositeAdapter composite = new CompositeAdapter();
            composite.add(new com.itk.browsersolution.adapters.firefox.js.PortalAdapter());
            composite.add(new com.itk.browsersolution.adapters.v90110.all.js.PortalAdapter());
            adapter = composite;
        } else if (baseFile.endsWith("portal/index.htm") || baseFile.endsWith("portal\\index.htm")) {
            adapter = new IndexAdapter();            
        } else if (baseFile.equals("browserCheck.js")) {
            adapter = new BrowserCheckAdapter();
        } else if (baseFile.equals("common.js")) {
            adapter = new CommonAdapter();
        } else if (baseFile.equals("servenv.js")) {
            adapter = new ServEnvAdapter();
        } else if (baseFile.equals("home.js")) {
            adapter = new HomeAdapter();
        } else if (baseFile.equals("inbasket.js")) {
            adapter = new InBasketAdapter();
        } else if (baseFile.equals("pages.js")) {
            adapter = new PagesAdapter();
        } else if (baseFile.equals("portal.css")) {
            adapter = new PortalCSSAdapter();
        } else if (baseFile.equals("formutil.js")) {
            adapter = new FormUtilAdapter();
        } else if (baseFile.equals("magic.js")) {
            adapter = new MagicAdapter();
        } else if (baseFile.equals("PortalConfig.js")) {
            adapter = new PortalConfigAdapter();
        } else if (baseFile.equals("sso.js")) {
            adapter = new SSOAdapter();
        }


        if (adapter != null) {
            adapters.put(baseFile, adapter);
        }

        return adapter;
    }
}
