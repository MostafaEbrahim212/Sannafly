@extends('errors.layout')
@section('code', '500')
@section('title', app()->getLocale() === 'ar' ? 'خطأ غير متوقع في الخادم' : 'Unexpected Server Error')
@section('message', app()->getLocale() === 'ar' ? 'حدث خطأ مؤقت لدينا، جاري العمل على حله.' : 'Something went wrong on our end. Please try again shortly.')
