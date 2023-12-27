using Dou.Misc.Attr;
using SGDS.Controllers.comm;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SGDS.Controllers.Prj
{
    //沒有要掛上
    [SGDSHtmlIFrameMenuDef(Id = "AllFStaDashboard", Name = "全國淹水感測器狀態儀表板", MenuPath = "資料查詢", Action = "Index", Index = 9, AllowAnonymous = false, Func = FuncEnum.None, Url = "https://www.dprcflood.org.tw/FsensorDashB")]
    public class AllFStaController : EmbedHtmlController
    {
        // GET: AllFSta
        public ActionResult Index()
        {
            return View();
        }
    }
}