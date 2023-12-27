using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SGDS.Controllers.Path
{
    [Dou.Misc.Attr.MenuDef(Name = "資料查詢", Index = 10, IsOnlyPath = true, Icon = "~/images/menu/menu_data.png")]
    public class DQueryController : Controller
    {
        // GET: DQuery
        public ActionResult Index()
        {
            return View();
        }
    }
}