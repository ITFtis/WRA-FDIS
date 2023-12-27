using Dou.Misc.Attr;
using SGDS.Controllers.comm;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SGDS.Controllers.Prj
{
    //[SGDSHtmlIFrameMenuDef(Id = "EFMap", Name = "人工匯入災情", MenuPath = "淹水範圍推估", Index = 3, Action = "Index", AllowAnonymous = false, Url = "EFMap.html")]
    [MenuDef(Id = "EFMap", Name = "人工匯入災情", MenuPath = "淹水範圍推估", Index = 3, Action = "Index", AllowAnonymous = false, Func = FuncEnum.None)]
    public class EFMapController : NoModelController
    {
        // GET: EFMap
        public ActionResult Index()
        {
            var DSD= AFunction(4);
            //var dsd = new AA();
            ViewBag.HasGis = true;
            ViewBag.Leaflet = true;
            ViewBag.StatisticsData = true;
            return View();
        }
        //public class AA : ABC
        //{
        //    protected override void A()
        //    {
        //        base.A();
        //    }
        //    protected override void B()
        //    {
        //        base.B();
        //    }
        //}

        //public class ABC
        //{
        //    protected virtual void A()
        //    {

        //    }
        //    protected override void B()
        //    {

        //    }
        //}

        public int AFunction(int value)
        {

            int result = -1;
            if (value <= 0)

                result = 1;

            else if (value % 2 == 0)
                result = AFunction(value - 2) * value;
            else
                result = AFunction(value - 1) * value;
            return result;
        }
    }
}