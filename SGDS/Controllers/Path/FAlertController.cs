using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SGDS.Controllers.Path
{
    [Dou.Misc.Attr.MenuDef(Name = "淹水預警", Index = 5, IsOnlyPath = true, Icon = "~/images/menu/menu_warning.png")]
    public class FAlertController : Controller
    {
        // GET: FAlert
        public ActionResult Index()
        {
            return View();
        }
    }
}