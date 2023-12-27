using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SGDS.Controllers.Path
{
    [Dou.Misc.Attr.MenuDef(Name = "情資查詢", Index = 1, IsOnlyPath = true, Icon = "~/images/menu/menu_info.png")]
    public class FQueryController : Controller
    {
        // GET: FQuery
        public ActionResult Index()
        {
            return View();
        }
    }
}