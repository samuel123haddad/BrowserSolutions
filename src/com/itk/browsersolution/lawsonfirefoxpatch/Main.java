package com.itk.browsersolution.lawsonfirefoxpatch;

import com.itk.browsersolution.adapters.AdapterFactory;
import com.itk.browsersolution.adapters.interfaces.IFileAdapter;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.FileUtils;
import com.itk.browsersolution.lawsonfirefoxpatch.utils.TextCursor;
import com.itk.browsersolution.mods.ModsFactory;
import java.io.File;
import java.util.List;
import java.util.Scanner;

/**
 * Is necessary change this files
 *   lawson/portal/forms/magic.js
 *   lawson/portal/objects/PortalConfig.js
 *   lawson/portal/index.htm
 *   lawson/portal/portal.js
 *   lawson/portal/common.js
 *   lawson/portal/servenv.js
 *   lawson/portal/inbasket/inbasket.js
 *   lawson/portal/inbasket/inbasket.htm
 *   lawson/portal/inbasket/pfdetail.htm
 *   lawson/portal/about.htm
 *   lawson/portal/admin/rolemgr/index.htm
 *   lawson/portal/dialogs/error_msgdlg.htm
 *   lawson/portal/dialogs/foldersel.htm
 *   lawson/portal/dialogs/fontpick.htm
 *   lawson/portal/dialogs/msgdlg.htm
 *   lawson/portal/dialogs/promptdlg.htm
 *   lawson/portal/dialogs/searchdlg.htm
 *   lawson/portal/drill/drsearch.htm
 *   lawson/portal/forms/formhost.htm
 *   lawson/portal/forms/prevhost.htm
 *   lawson/portal/forms/wizard.htm
 *   lawson/portal/hotkeys.htm
 *   lawson/portal/objects/tabhost.htm
 *   lawson/portal/pages/index.htm
 *   lawson/portal/reports/jobdef.htm
 *   lawson/portal/reports/joblist.htm
 *   lawson/portal/reports/jobschedule.htm
 *   lawson/portal/reports/printfiles.htm
 *   lawson/portal/users/preferences/index.htm
 *   lawson/portal/utility/bldanalysis.htm
 *   lawson/portal/utility/bldindex.htm
 *   lawson/portal/utility/formdel.htm
 *   lawson/portal/utility/formpdl.htm
 *   lawson/portal/pages/pages.js
 * 
 * @description Compatible mode for Opera 12
 * @author Samuel Haddad - shaddad@itktechnologies.com
 * @since 29/08/2012
 * 
 *   lawson/portal/browserCheck.js
 *
 * 
 * ======================================================================
 * Below Start section #1 that was implemented in 31/AGO/2012.
 * ======================================================================
 * do not forget put inside /sso/sso.js in function SSORequest the code:
 * 
 * 		
    if (new SSOBrowser().isSAF) {
    if (url.slice(0,7) == "http://" || url.slice(0,8) == "https://") {
    if (typeof url.slice == 'undefined')
    alert("slice undefined");
    else if (typeof url.indexOf == 'undefined')
    alert("indexOf undefined");
    else
    url = url.slice(url.indexOf("/",8));
    }
    }

 * ======================================================================
 * End of section #1.
 * ======================================================================
 * @author iTK Technologies,LLC
 * @version 1.0
 * 
 * Adding support to Opera 12.
 * Uncomment Opera browser checking.
 * 
 * @author Samuel Haddad - shaddad@itktechnologies.com
 * @since 31/08/2012
 * @version 2.2
 * 
 * Contemplates Lawson 9.0.1.10
 * Files impacted by this change
 * portal/edits.js
 * portal/globals.js
 * portal/portal.js
 * 
 * @author Samuel Haddad - shaddad@itktechnologies.com
 * @since 26/09/12
 * @version 2.4

 */
public class Main {

    private static String webdirName = "";
    private static String bkpdirName = "";
    private static String wasHome = "";
    private static String targetVersion = "9.0.1.10";
    private static String genDir = null;
    private static String mods = null;
    private static boolean uninstall = false;
    private static boolean quiet = false;
    private static boolean listMods = false;
    
    private static final String SCRIPT_FILES[] = {
        "lawson/portal/objects/PortalConfig.js",
        "lawson/portal/edits.js",
        "lawson/portal/globals.js",
        "lawson/portal/portal.js",
        "lawson/portal/portal.css",
        "lawson/portal/common.js",
        "lawson/portal/servenv.js",
        "lawson/portal/home.js",
        "lawson/portal/inbasket/inbasket.js",
        "lawson/portal/pages/pages.js",
        "lawson/portal/forms/magic.js",
        "lawson/portal/forms/formutil.js",        
        "lawson/portal/browserCheck.js"
    };
    private static final String HTML_FILES[] = {
        "lawson/portal/home.htm",
        "lawson/portal/admin/home.htm",
        "lawson/portal/users/home.htm",
        "lawson/portal/index.htm",
        "lawson/portal/error.htm",
        "lawson/portal/inbasket/inbasket.htm",
        "lawson/portal/inbasket/pfdetail.htm",
        "lawson/portal/about.htm",
        "lawson/portal/admin/rolemgr/index.htm",
        "lawson/portal/dialogs/error_msgdlg.htm",
        "lawson/portal/dialogs/foldersel.htm",
        "lawson/portal/dialogs/fontpick.htm",
        "lawson/portal/dialogs/msgdlg.htm",
        "lawson/portal/dialogs/promptdlg.htm",
        "lawson/portal/dialogs/searchdlg.htm",
        "lawson/portal/drill/drsearch.htm",
        "lawson/portal/forms/formhost.htm",
        "lawson/portal/forms/prevhost.htm",
        "lawson/portal/forms/wizard.htm",
        "lawson/portal/hotkeys.htm",
        "lawson/portal/objects/tabhost.htm",
        "lawson/portal/pages/index.htm",
        "lawson/portal/reports/jobdef.htm",
        "lawson/portal/reports/joblist.htm",
        "lawson/portal/reports/jobschedule.htm",
        "lawson/portal/reports/printfiles.htm",
        "lawson/portal/users/preferences/index.htm",
        "lawson/portal/utility/bldanalysis.htm",
        "lawson/portal/utility/bldindex.htm",
        "lawson/portal/utility/formdel.htm",
        "lawson/portal/utility/formpdl.htm"
    };

    private static File findDir(final File base, final String name) {
        File files[] = base.listFiles();
        if (files != null) {
            for(int i=0; i < files.length; i++) {
                File f = files[i];
                if (f.isDirectory() && ! f.getName().startsWith(".")) {
                    if (f.getName().equalsIgnoreCase(name)) {
                        return f;
                    }
                    File o = findDir(f, name);
                    if (o != null) {
                        return o;
                    }
                }
            }
        }
        return null;
    }
    
    /**
     * @param args the command line arguments
     */
    public static void main(String[] args) {

        System.out.println("Browser Solution Patch - Version 2.3");
        if (args.length == 0) {
            System.out.println("Syntax:");
            System.out.println("  java -jar InstallBrowserSolution.jar [-u] -w <WEBDIR> -t <BKPDIR>");
            System.out.println("  java -jar InstallBrowserSolution.jar -j <GENDIR>");
            System.out.println("  java -jar InstallBrowserSolution.jar -d <WAS_HOME>");
            System.out.println("Parameters:");
            System.out.println("  -u - uninstall patch");
            System.out.println("  -m - list mods");
            System.out.println("  -k - install mods");
            System.out.println("  -v <target version> - Example: 9.0.1.10 or 9.0.1.7");
            System.out.println("  -w <webpath> - web directory");
            System.out.println("  -t <tmppath> - backup directory");
            System.out.println("  -q - quietly running, no parameter will be prompted");            
            System.out.println("  -d <WAS_HOME>- Install LawSec fix direct in websphere expanded directory");
            System.out.println("  -j <GENDIR>  - Install LawSec fix inside <GENDIR>/assembly/applications/ear/lawsec.ear*");
            System.out.println("                 In this case is necessary redeploy lawsec.ear in websphere");
            System.out.println("  -f <LAWSEC>  - Install LawSec fix inside <LAWSEC> file");
            System.out.println("                 In this case is necessary redeploy <LAWSEC> in websphere");
            
        }
        
        
        for (int i = 0; i < args.length; i++) {
            if ("-w".equals(args[i])) {
                webdirName = args[++i];
            } else if ("-u".equalsIgnoreCase(args[i])) {
                uninstall = true;
            } else if ("-q".equalsIgnoreCase(args[i])) {
                quiet = true;                
            } else if ("-m".equalsIgnoreCase(args[i])) {
                listMods = true;                                
            } else if ("-k".equalsIgnoreCase(args[i])) {
                mods = args[++i];                
            } else if ("-t".equalsIgnoreCase(args[i])) {
                bkpdirName = args[++i];
            } else if ("-v".equalsIgnoreCase(args[i])) {
                targetVersion = args[++i];                
            } else if ("-d".equalsIgnoreCase(args[i])) {
                wasHome = args[++i];
            } else if ("-j".equalsIgnoreCase(args[i])) {
                genDir = args[++i];
            }
        }
        
        Scanner scan = new Scanner(System.in);
        
        System.out.println("");
        System.out.println("Current Settings");
        System.out.println("================");
        System.out.println("Portal Web Directory (-w): " + webdirName);
        System.out.println("Backup Directory (-t): " + bkpdirName);
        System.out.println("WebSphere Home (-d): " + wasHome);
        System.out.println("Mods (-k): " + mods);
        System.out.println("Target Version (-v): " + targetVersion);        
        System.out.println("");
        System.out.println("");
        
        if (!quiet)
        {
            System.out.print("Please, enter the new Portal Web Directory or press key [enter] to use current: ");        
            String newWebDir = scan.nextLine();
            webdirName = newWebDir != null && newWebDir.trim().length() > 0 ? newWebDir.trim() : webdirName;
            System.out.println("Portal Web Directory (-w): " + webdirName);
            System.out.println("");
            System.out.println("");

            System.out.print("Please, enter the new Backup Directory or press key [enter] to use current: ");        
            String newBkpDirName = scan.nextLine();
            bkpdirName = newBkpDirName != null && newBkpDirName.trim().length() > 0 ? newBkpDirName.trim() : bkpdirName;
            System.out.println("Backup Directory (-t): " + bkpdirName);
            System.out.println("");
            System.out.println("");

            System.out.print("Please, enter the new WebSphere Home or press key [enter] to use current: ");        
            String newWasHome = scan.nextLine();
            wasHome = newWasHome != null && newWasHome.trim().length() > 0 ? newWasHome.trim() : wasHome;
            System.out.println("WebSphere Home (-d): " + wasHome);
            System.out.println("");
            System.out.println("");

            System.out.print("Please, enter the mods identifiers separated by commas or press key [enter] to use current: ");        
            String newMods = scan.nextLine();
            mods = newMods != null && newMods.trim().length() > 0 ? newMods.trim() : mods;
            System.out.println("Mods (-k): " + mods);
            System.out.println("");
            System.out.println("");
            
            System.out.print("Please, enter the new Target Version or press key [enter] to use current: ");        
            String newTargetVersion = scan.nextLine();
            targetVersion = newTargetVersion != null && newTargetVersion.trim().length() > 0 ? newTargetVersion.trim() : targetVersion;
            System.out.println("Target Version (-v): " + targetVersion);
            System.out.println("");
            System.out.println("");
            
        }
        
       
        if (
                (
                (
                (webdirName == null || webdirName.trim().length() == 0)
                &&
                (bkpdirName == null || bkpdirName.trim().length() == 0)
                )
                && 
                ( 
                (wasHome == null || wasHome.trim().length() == 0)
                && 
                (bkpdirName == null || bkpdirName.trim().length() == 0)
                )
                && 
                ( 
                    (mods == null || mods.trim().length() == 0)
                )
                && 
                ( 
                    listMods == false
                )
                
                
         ) || (targetVersion == null || targetVersion.trim().length() == 0)
                )
        {            
            System.exit(0);
        }
        
        if (listMods)
        {
            doListMods();
        }else
        {
            processFiles();
        }
        
        
        
    }
    
    private static void processFiles()
    {
        System.out.println("******************* Begin *******************");
        AdapterFactory factory = new AdapterFactory();
        File bkpdir = new File(bkpdirName);
        processPortal(bkpdir, factory);
        processWAS(bkpdir, factory);
        
        System.out.println("******************* Done *******************");
        
    }
    
    private static void processPortal(File bkpdir, AdapterFactory factory)
    {
        if ((webdirName != null && webdirName.trim().length() > 0) 
                && (bkpdirName != null && bkpdirName.trim().length() > 0 )
                ) {
            
            File webdir = new File(webdirName);
            System.out.println("WebDir : "+webdir.getAbsolutePath());
            System.out.println("TmpDir : "+bkpdir.getAbsolutePath());
            System.out.println("*********************************************");
            // --- UnInstall Begin ---
            if (uninstall) {
                if (!bkpdir.exists()) {
                    System.out.println("I can't open tempdir "+bkpdir.getAbsolutePath());
                    System.exit(0);
                }
                System.out.println("Restoring HTML files ...");
                for (int i=0; i < HTML_FILES.length; i++) {
                    String html = HTML_FILES[i];
                    File dst = new File(webdir, html);
                    File src = new File(bkpdir, html);
                    if (src.exists()) {
                        System.out.println("Restoring ... "+html);
                        FileUtils.copyFile(src, dst);
                    }
                }
                System.out.println("Restoring JavaScript files ...");
                for (int i=0; i < SCRIPT_FILES.length; i++) {
                    String js = SCRIPT_FILES[i];
                    File dst = new File(webdir, js);
                    File src = new File(bkpdir, js);
                   
                    if (src.exists()) {
                        System.out.println("Restoring ... "+js);
                        FileUtils.copyFile(src, dst);
                    }
                }
                
                System.out.println("Restoring WAS files ...");
                String ssoFile = "sso.war";
                File dst = new File(wasHome, ssoFile);
                File src = new File(bkpdir, ssoFile);
                if (src.exists()) {
                    System.out.println("Restoring ... "+ssoFile);
                    FileUtils.copyFile(src, dst);
                }
                
                
                File webportal = new File(webdir, "lawson/portal");
                new File(webportal, "forms/dom.js").delete();
                new File(webportal, "forms/formhost2.htm").delete();
                new File(webportal, "forms/formutil2.js").delete();
                new File(webportal, "forms/lawform2.js").delete();
                new File(webportal, "forms/lawform2.xsl").delete();
                new File(webportal, "forms/util.js").delete();
                new File(webportal, "forms/xmltoken.js").delete();
                new File(webportal, "forms/xpath.js").delete();
                new File(webportal, "forms/xslt.js").delete();
                // -- UnInstall End --
            } else {
                // -- Install Begin ---
                System.out.println("Checking html files ...");
                for (int i=0; i < HTML_FILES.length; i++) {
                    String html = HTML_FILES[i];
                    File src = new File(webdir, html);
                    File dst = new File(bkpdir, html);
                    boolean any = false;
                    if (! dst.exists() || src.lastModified() < dst.lastModified()) {
                        FileUtils.copyFile(src, dst);
                    }
                    StringBuffer bf = FileUtils.loadText(src);
                    TextCursor cursor = new TextCursor(bf);
                    int count = 0;
                    while (cursor.find("</img>")) {
                        count++;
                        cursor.delete(6);
                        if (cursor.findPrior(">")) {
                            cursor.insert(" /");
                        }
                    }
                    any = any || (count != 0);
                    count = 0;
                    while (cursor.find("</input>")) {
                        count++;
                        cursor.delete(8);
                        if (cursor.findPrior(">")) {
                            cursor.insert(" /");
                        }
                    }
                    any = any || (count != 0);
                    count = 0;
                    while (cursor.find("</link>")) {
                        count++;
                        cursor.delete(7);
                        if (cursor.findPrior(">")) {
                            cursor.insert(" /");
                        }
                    }
                    any = any || (count != 0);
                    if (any) {
                        System.out.println("modifing " + src);
                        FileUtils.saveText(src, bf);
                    }
                    String name = src.getAbsolutePath();
                    IFileAdapter adapter = factory.getInstance(targetVersion, name);
                    if (adapter != null)
                    {
                        boolean modified = adapter.changeContent(src, null);
                        if (modified) {
                            System.out.println("File " + src + " was modified.");
                        }else
                        {
                            System.out.println("File " + src + " wasn´t modified.");
                        }
                        
                    }
                    
                }
                
                System.out.println("******************* Copying resources *******************");
                File webportal = new File(webdir, "lawson/portal");
                FileUtils.copyInexistantResource("browserCheck.js", webportal);
                FileUtils.copyResource("forms/dom.js", webportal);
                FileUtils.copyResource("forms/formhost2.htm", webportal);
                FileUtils.copyResource("forms/formutil2.js", webportal);
                FileUtils.copyResource("forms/lawform2.js", webportal);
                FileUtils.copyResource("forms/lawform2.xsl", webportal);
                FileUtils.copyResource("forms/util.js", webportal);
                FileUtils.copyResource("forms/xmltoken.js", webportal);
                FileUtils.copyResource("forms/xpath.js", webportal);
                FileUtils.copyResource("forms/xslt.js", webportal);
                
                System.out.println("Checking javascript files ...");
                for (int i=0; i < SCRIPT_FILES.length; i++) {
                    String js = SCRIPT_FILES[i];
                    File src = new File(webdir, js);
                    File dst = new File(bkpdir, js);
                    
                    if (! dst.exists() || src.lastModified() < dst.lastModified()) {
                        System.out.println("Backup file: "+js);
                        FileUtils.copyFile(src, dst);
                    }
                    String name = src.getName();
                    
                    IFileAdapter adapter = factory.getInstance(targetVersion, name);
                    if (adapter != null)
                    {
                        boolean modified = adapter.changeContent(src, null);
                        if (modified) {
                            System.out.println("File " + src + " was modified.");
                        }else
                        {
                            System.out.println("File " + src + " wasn´t modified.");
                        }
                        
                    }
                }
                
                // -- Install End --
            }
        }
        
    }
    
    private static void processWAS(File bkpdir, AdapterFactory factory)
    {
        if (
                (wasHome != null && wasHome.trim().length() > 0) 
                && (bkpdirName != null && bkpdirName.trim().length() > 0 )
           )
        {
            File was = new File(wasHome);
            if (! was.exists()) {
                System.err.println("WAS_HOME : "+was.getAbsolutePath()+" doesn't exist");
            } else {
                File profile = new File(was, "AppServer/profiles");
                if (! profile.exists())
                {
                    profile = was;
                }                    
                
                String ssoFile = "sso.war";
                
                File ssoWar = findDir(profile, ssoFile);
                String name = "sso.js";
                if (ssoWar != null) {
                    File ssojs = new File(ssoWar, name);
                    
                    if (! ssojs.exists()) {
                        System.err.println("Not found "+ssojs.getAbsolutePath());
                    } else {


                        File dst = new File(bkpdir, ssoFile.concat("/").concat(name));
                        if (! dst.exists() || ssojs.lastModified() < ssojs.lastModified()) {
                            System.out.println("Backup file: "+ssoFile);
                            FileUtils.copyFile(ssojs, dst);
                        }
                        
                        IFileAdapter adapter = factory.getInstance(targetVersion, name);
                        if (adapter != null)
                        {
                            boolean modified = adapter.changeContent(ssojs, null);
                            if (modified) {
                                System.out.println("File sso.js was modified in "+ssoWar);
                            }else
                            {
                                System.out.println("File sso.js wasn´t modified in "+ssoWar);
                            }
                        }                        
                    }
                } else {
                    System.err.println("I can't find directory sso.war inside "+profile.getAbsolutePath());
                }
            }
        }
        
    }
    
    /**
     * List all supported mods.
     * 
     */
    private static void doListMods()
    {
        ModsFactory factory = new ModsFactory();
        List<String> descriptions = factory.getDescriptions();
        if (descriptions != null && !descriptions.isEmpty())
        {
            for (String description : descriptions)
            {
                System.out.println(description);
            }
        }
    }
}
