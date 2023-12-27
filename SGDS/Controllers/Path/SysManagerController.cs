using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SGDS.Controllers.Path
{
    [Dou.Misc.Attr.MenuDef( Name = "系統管理",Index =int.MaxValue, IsOnlyPath =true, Icon = "~/images/menu/menu_system.png")]
    public class SysManagerController : Controller
    {
        // GET: SysManager
        public ActionResult Index()
        {
            return View();
        }
    }
}